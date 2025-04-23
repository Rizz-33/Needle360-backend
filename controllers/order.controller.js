import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { ORDER_ACTIONS, ORDER_STATUSES } from "../constants.js";
import Order from "../models/order.model.js";

// Helper function to properly sanitize an order for response
const sanitizeOrder = (order) => {
  const orderObj = order.toObject();

  // Convert ObjectIds to strings
  orderObj._id = orderObj._id.toString();
  orderObj.tailorId = orderObj.tailorId?.toString();
  orderObj.customerId = orderObj.customerId?.toString();

  // Convert Map to plain object for measurements
  if (order.measurements instanceof Map) {
    orderObj.measurements = Object.fromEntries(order.measurements);
  } else if (
    orderObj.measurements &&
    typeof orderObj.measurements === "object"
  ) {
    // Ensure measurements is an object if already converted
    orderObj.measurements = { ...orderObj.measurements };
  } else {
    orderObj.measurements = {};
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
    res.status(500).json({
      message: "Error fetching customer orders",
      error: error.message,
    });
  }
};

// Create a new order (accessible to customers and tailors)
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
      customerId: req.user.role === 1 ? req.user._id : req.body.customerId,
      tailorId:
        req.user.role === 4
          ? req.user._id
          : new mongoose.Types.ObjectId(req.body.tailorId),
      status: "requested", // Explicitly set initial status to requested
    };

    // Validate tailorId for customers
    if (req.user.role !== 4 && !orderData.tailorId) {
      return res
        .status(400)
        .json({ message: "Tailor ID is required for customers" });
    }

    // Validate that tailorId is a valid ObjectId
    if (
      orderData.tailorId &&
      !mongoose.Types.ObjectId.isValid(orderData.tailorId)
    ) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const order = new Order(orderData);
    await order.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    io.to(`tailor:${order.tailorId}`).emit(
      "orderCreated",
      sanitizeOrder(order)
    );
    io.to(`customer:${order.customerId}`).emit(
      "orderCreated",
      sanitizeOrder(order)
    );

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

// Approve or reject an order (tailor only)
export const approveOrRejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // action: 'approve' or 'reject'

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Validate action (using imported ORDER_ACTIONS)
    if (!ORDER_ACTIONS.includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const order = await Order.findOne({ _id: id, tailorId: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "requested") {
      return res
        .status(400)
        .json({ message: "Order is not in requested status" });
    }

    // Update status based on action
    order.status = action === "approve" ? "pending" : "cancelled";
    await order.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    io.to(`tailor:${order.tailorId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );
    io.to(`customer:${order.customerId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );

    // Properly sanitize the order for response
    const sanitizedOrder = sanitizeOrder(order);

    res.json(sanitizedOrder);
  } catch (error) {
    console.error("Error approving/rejecting order:", error);
    res.status(400).json({
      message: "Error approving/rejecting order",
      error: error.message,
    });
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
          updatedAt: Date.now(),
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    io.to(`tailor:${order.tailorId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );
    io.to(`customer:${order.customerId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );

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

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    io.to(`tailor:${order.tailorId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );
    io.to(`customer:${order.customerId}`).emit(
      "orderStatusUpdated",
      sanitizeOrder(order)
    );

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

    // Emit WebSocket event for deletion
    const io = req.app.get("io");
    io.to(`tailor:${order.tailorId}`).emit("orderDeleted", { id });
    io.to(`customer:${order.customerId}`).emit("orderDeleted", { id });

    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res
      .status(400)
      .json({ message: "Error deleting order", error: error.message });
  }
};
