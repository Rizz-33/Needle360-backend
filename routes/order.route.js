import express from "express";
import { body } from "express-validator";
import {
  ORDER_ACTIONS,
  ORDER_STATUSES,
  PREDEFINED_SERVICES,
} from "../constants.js";
import {
  approveOrRejectOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderByCustomerId,
  updateOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import {
  createPaymentIntent,
  selectCOD,
} from "../controllers/payment.controller.js";
import { isCustomer, isTailor } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Base validation for creating/updating orders (shared fields)
const baseOrderValidation = [
  body("customerContact")
    .isMobilePhone("any")
    .withMessage("Valid phone number is required"),
  body("orderType").isIn(PREDEFINED_SERVICES).withMessage("Invalid order type"),
  body("dueDate")
    .isISO8601()
    .toDate()
    .custom((value) => value >= new Date())
    .withMessage("Due date must be in the future"),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a non-negative number"),
];

// Validation for tailors (tailorId is optional)
const tailorOrderValidation = [
  ...baseOrderValidation,
  body("tailorId")
    .optional()
    .isMongoId()
    .withMessage("Valid tailor ID is required if provided"),
];

// Validation for customers (tailorId is required)
const customerOrderValidation = [
  ...baseOrderValidation,
  body("tailorId")
    .notEmpty()
    .withMessage("Tailor ID is required")
    .isMongoId()
    .withMessage("Valid tailor ID is required"),
];

// Routes for order management (tailor)
router.get("/", verifyToken, isTailor, getAllOrders);
router.post("/", verifyToken, isTailor, tailorOrderValidation, createOrder);
router.put("/:id", verifyToken, isTailor, tailorOrderValidation, updateOrder);
router.put(
  "/:id/status",
  verifyToken,
  isTailor,
  [body("status").isIn(ORDER_STATUSES).withMessage("Invalid status")],
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
router.post(
  "/customer",
  verifyToken,
  isCustomer,
  customerOrderValidation,
  createOrder
);

// Payment routes
router.post(
  "/payment/intent",
  verifyToken,
  isCustomer,
  [body("orderId").isMongoId().withMessage("Valid order ID is required")],
  createPaymentIntent
);
router.post(
  "/payment/cod",
  verifyToken,
  isCustomer,
  [body("orderId").isMongoId().withMessage("Valid order ID is required")],
  selectCOD
);

export default router;
