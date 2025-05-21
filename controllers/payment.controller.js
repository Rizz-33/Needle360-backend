import dotenv from "dotenv";
import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/order.model.js";

// Load environment variables
dotenv.config();

// Validate Stripe Secret Key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY not found in environment variables");
}

// Initialize Stripe with API version specification
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Specify API version for consistency
  typescript: false,
});

// Update payment status controller with improved error handling
export const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  paymentMethod = null
) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID format");
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order not found with ID: ${orderId}`);
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }

    // Add timestamp for the payment status change
    order.paymentUpdatedAt = new Date();

    await order.save();

    // Emit WebSocket event if available
    const io = global.io;
    if (io) {
      // Ensure IDs are converted to strings
      const tailorId = order.tailorId || order.tailor;
      const customerId = order.customerId || order.customer;

      if (tailorId) {
        io.to(`tailor:${tailorId.toString()}`).emit("paymentStatusUpdated", {
          orderId: order._id.toString(),
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
        });
      }

      if (customerId) {
        io.to(`customer:${customerId.toString()}`).emit(
          "paymentStatusUpdated",
          {
            orderId: order._id.toString(),
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
          }
        );
      }
    }

    return order;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

// Create a Stripe Payment Intent for an order with improved error handling
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Validate order with proper error handling
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is in proper state for payment
    if (order.status !== "completed") {
      return res.status(400).json({
        message: "Order is not in completed state",
        currentStatus: order.status,
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    if (order.paymentStatus === "cod") {
      return res
        .status(400)
        .json({ message: "Order is already set to Cash on Delivery" });
    }

    // Check if totalAmount is valid
    if (!order.totalAmount || order.totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order amount",
        amount: order.totalAmount,
      });
    }

    // Create Payment Intent with Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: "lkr",
        metadata: {
          orderId: order._id.toString(),
          customerEmail: order.customerEmail || "no-email@provided.com",
          shopName: order.shopName || "Needle360 Order",
        },
        description: `Payment for Order #${order._id.toString().slice(-6)}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update order with payment intent ID
      order.paymentIntentId = paymentIntent.id;
      await order.save();

      console.log(
        `Created payment intent ${paymentIntent.id} for order ${orderId}`
      );

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (stripeError) {
      console.error("Stripe error creating payment intent:", stripeError);
      return res.status(500).json({
        message: "Error processing payment with Stripe",
        details: stripeError.message,
      });
    }
  } catch (error) {
    console.error("Server error creating payment intent:", error);
    res.status(500).json({
      message: "Server error creating payment intent",
      error: error.message,
    });
  }
};

// Select COD as payment method with improved error handling
export const selectCOD = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({
        message: "Order is not in completed state",
        currentStatus: order.status,
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    if (order.paymentStatus === "cod") {
      return res
        .status(400)
        .json({ message: "Order is already set to Cash on Delivery" });
    }

    // Update payment status to cod
    try {
      const updatedOrder = await updatePaymentStatus(orderId, "cod", "cod");

      console.log(`Order ${orderId} set to Cash on Delivery`);

      res.json({
        message: "Cash on Delivery selected successfully",
        order: updatedOrder,
      });
    } catch (updateError) {
      console.error("Error updating payment status for COD:", updateError);
      return res.status(500).json({
        message: "Error setting order to Cash on Delivery",
        error: updateError.message,
      });
    }
  } catch (error) {
    console.error("Server error selecting COD:", error);
    res.status(500).json({
      message: "Server error selecting Cash on Delivery",
      error: error.message,
    });
  }
};

// Stripe Webhook to handle payment events with improved error handling
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("Missing Stripe signature in webhook request");
    return res.status(400).json({ message: "Missing Stripe signature" });
  }

  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not found in environment variables");
    return res.status(500).json({ message: "Webhook configuration error" });
  }

  let event;

  try {
    // Raw body is necessary for signature verification
    const rawBody = req.rawBody || req.body;
    if (!rawBody) {
      return res.status(400).json({ message: "Missing request body" });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({
      message: "Webhook signature verification failed",
      error: error.message,
    });
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
          console.error(
            "Payment Intent missing orderId in metadata",
            paymentIntent.id
          );
          return res
            .status(400)
            .json({ message: "Missing orderId in payment metadata" });
        }

        try {
          const updatedOrder = await updatePaymentStatus(
            orderId,
            "paid",
            "stripe"
          );
          console.log(
            `Payment succeeded for order ${orderId}, Payment Intent: ${paymentIntent.id}`
          );
        } catch (error) {
          console.error(
            `Error updating order ${orderId} after payment:`,
            error
          );
        }
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata.orderId;

        if (!failedOrderId) {
          console.error(
            "Failed Payment Intent missing orderId in metadata",
            failedPaymentIntent.id
          );
          return res
            .status(400)
            .json({ message: "Missing orderId in payment metadata" });
        }

        try {
          await updatePaymentStatus(failedOrderId, "failed", "stripe");
          console.log(
            `Payment failed for order ${failedOrderId}, Payment Intent: ${failedPaymentIntent.id}`
          );
        } catch (error) {
          console.error(
            `Error handling failed payment for order ${failedOrderId}:`,
            error
          );
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 success response to acknowledge receipt of the event
    res.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res
      .status(500)
      .json({ message: "Error processing webhook", error: error.message });
  }
};
