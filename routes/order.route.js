import express from "express";
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  updateOrder,
} from "../controllers/order.controller.js";
import { isTailor } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Routes for order management
router.get("/", verifyToken, isTailor, getAllOrders);
router.post("/", verifyToken, isTailor, createOrder);
router.put("/:id", verifyToken, isTailor, updateOrder);
router.delete("/:id", verifyToken, isTailor, deleteOrder);

export default router;
