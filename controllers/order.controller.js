import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { ORDER_STATUSES } from "../constants.js";
import Order from "../models/order.model.js";

// Helper function to properly sanitize an order for response
const sanitizeOrder = (order) => {
  const orderObj = order.toObject();

  // Convert ObjectIds to strings
  orderObj._id = orderObj._id.toString();
  orderObj.tailorId = orderObj.tailorId.toString();
  orderObj.customerId = orderObj.customerId.toString();

  // Convert Map to plain object for measurements
  if (order.measurements instanceof Map) {
    orderObj.measurements = Object.fromEntries(order.measurements);
  }

  return orderObj;
};

// Get all orders for the authenticated tailor
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { tailorId: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    // Convert ObjectId to string and fix measurements in response
    const sanitizedOrders = orders.map((order) => sanitizeOrder(order));

    res.json({ orders: sanitizedOrders, total, page, limit });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// Get orders by customer ID
export const getOrderByCustomerId = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const customerId = req.user._id;

    const query = { customerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    // Sanitize orders for response
    const sanitizedOrders = orders.map((order) => sanitizeOrder(order));

    res.json({ orders: sanitizedOrders, total, page, limit });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res
      .status(500)
      .json({
        message: "Error fetching customer orders",
        error: error.message,
      });
  }
};

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const orderData = {
      ...req.body,
      tailorId: req.user._id,
      status: "pending", // Explicitly set initial status to pending
    };

    const order = new Order(orderData);
    await order.save();

    // Properly sanitize the order for response
    const sanitizedOrder = sanitizeOrder(order);

    res.status(201).json(sanitizedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(400)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Update an order
export const updateOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Validate status if included in the update
    if (req.body.status && !ORDER_STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid status value",
        validStatuses: ORDER_STATUSES,
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, tailorId: req.user._id },
      {
        $set: {
          ...req.body,
          updatedAt: Date.now(), // Always update the timestamp when changing status
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Properly sanitize the order for response
    const sanitizedOrder = sanitizeOrder(order);

    res.json(sanitizedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(400)
      .json({ message: "Error updating order", error: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Validate status
    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        validStatuses: ORDER_STATUSES,
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, tailorId: req.user._id },
      {
        $set: {
          status: status,
          updatedAt: Date.now(),
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Properly sanitize the order for response
    const sanitizedOrder = sanitizeOrder(order);

    res.json(sanitizedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(400)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Delete an order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOneAndDelete({
      _id: id,
      tailorId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res
      .status(400)
      .json({ message: "Error deleting order", error: error.message });
  }
};
