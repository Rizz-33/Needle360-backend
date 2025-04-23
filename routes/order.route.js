import express from "express";
import { body } from "express-validator";
import {
  approveOrRejectOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderByCustomerId,
  updateOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { isCustomer, isTailor } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ORDER_ACTIONS, ORDER_STATUSES, PREDEFINED_SERVICES } from "../constants.js";

const router = express.Router();

// Validation middleware for creating/updating orders
const orderValidation = [
  body("tailorId").isMongoId().withMessage("Valid tailor ID is required"),
  body("customerContact")
    .isMobilePhone("any")
    .withMessage("Valid phone number is required"),
  body("orderType")
    .isIn(PREDEFINED_SERVICES)
    .withMessage("Invalid order type"),
  body("dueDate")
    .isISO8601()
    .toDate()
    .custom((value) => value >= new Date())
    .withMessage("Due date must be in the future"),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a non-negative number"),
];

// Routes for order management (tailor)
router.get("/", verifyToken, isTailor, getAllOrders);
router.post("/", verifyToken, isTailor, orderValidation, createOrder);
router.put("/:id", verifyToken, isTailor, orderValidation, updateOrder);
router.put(
  "/:id/status",
  verifyToken,
  isTailor,
  [
    body("status")
      .isIn(ORDER_STATUSES)
      .withMessage("Invalid status"),
  ],
  updateOrderStatus
);
router.delete("/:id", verifyToken, isTailor, deleteOrder);

// Route for approving/rejecting orders (tailor)
router.put(
  "/:id/approve-reject",
  verifyToken,
  isTailor,
  [
    body("action")
      .isIn(ORDER_ACTIONS)
      .withMessage("Action must be 'approve' or 'reject'"),
  ],
  approveOrRejectOrder
);

// Routes for customers
router.get("/customer", verifyToken, isCustomer, getOrderByCustomerId);
router.post("/customer", verifyToken, isCustomer, orderValidation, createOrder);

export default router;
