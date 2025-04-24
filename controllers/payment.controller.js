import dotenv from "dotenv";
import Stripe from "stripe";
import Order from "../models/order.model.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Update payment status controller
export const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  paymentMethod = null
) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    await order.save();

    // Emit WebSocket event
    const io = global.io; // Assuming io is attached to global or passed via app
    if (io) {
      io.to(`tailor:${order.tailorId}`).emit("paymentStatusUpdated", {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      });
      io.to(`customer:${order.customerId}`).emit("paymentStatusUpdated", {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      });
    }

    return order;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

// Create a Stripe Payment Intent for an order
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order is not completed" });
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "cod") {
      return res
        .status(400)
        .json({ message: "Order is already paid or set to COD" });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: "lkr",
      metadata: { orderId: order._id.toString() },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      message: "Error creating payment intent",
      error: error.message,
    });
  }
};

// Select COD as payment method
export const selectCOD = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order is not completed" });
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "cod") {
      return res
        .status(400)
        .json({ message: "Order is already paid or set to COD" });
    }

    // Update payment status to cod
    const updatedOrder = await updatePaymentStatus(orderId, "cod", "cod");

    res.json({ message: "COD selected successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error selecting COD:", error);
    res.status(500).json({
      message: "Error selecting COD",
      error: error.message,
    });
  }
};

// Stripe Webhook to handle payment events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res
      .status(400)
      .json({ message: "Webhook Error", error: error.message });
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      try {
        await updatePaymentStatus(orderId, "paid", "stripe");
      } catch (error) {
        console.error("Error updating order after payment:", error);
      }
      break;
    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object;
      const failedOrderId = failedPaymentIntent.metadata.orderId;

      try {
        await updatePaymentStatus(failedOrderId, "failed");
      } catch (error) {
        console.error("Error handling failed payment:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
