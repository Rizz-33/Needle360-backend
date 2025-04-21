import express from "express";
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderByCustomerId,
  updateOrder,
} from "../controllers/order.controller.js";
import { isCustomer, isTailor } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Routes for order management
router.get("/", verifyToken, isTailor, getAllOrders);
router.post("/", verifyToken, isTailor, createOrder);
router.put("/:id", verifyToken, isTailor, updateOrder);
router.delete("/:id", verifyToken, isTailor, deleteOrder);

// Route for customers to get their own orders
router.get("/customer", verifyToken, isCustomer, getOrderByCustomerId);

export default router;
