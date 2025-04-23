import dotenv from "dotenv";
import Stripe from "stripe";
import Order from "../models/order.model.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
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
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    // Update order with COD
    order.paymentMethod = "cod";
    order.paymentStatus = "pending";
    await order.save();

    // Emit WebSocket event
    const io = req.app.get("io");
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

    res.json({ message: "COD selected successfully", order });
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
      sig
      //process.env.STRIPE_WEBHOOK_SECRET
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
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "paid";
          order.paymentMethod = "stripe";
          await order.save();

          // Emit WebSocket event
          const io = req.app.get("io");
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
      } catch (error) {
        console.error("Error updating order after payment:", error);
      }
      break;
    case "payment_intent.payment_failed":
      // Handle failed payment
      const failedPaymentIntent = event.data.object;
      const failedOrderId = failedPaymentIntent.metadata.orderId;
      try {
        const order = await Order.findById(failedOrderId);
        if (order) {
          order.paymentStatus = "failed";
          await order.save();

          // Emit WebSocket event
          const io = req.app.get("io");
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
      } catch (error) {
        console.error("Error handling failed payment:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
