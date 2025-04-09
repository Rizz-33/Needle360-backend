import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  getCustomerReviews,
  updateCustomerById,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/customers", getAllCustomers);
router.get("/customers/:id", getCustomerById);
router.get("/customers/:id/reviews", getCustomerReviews);
router.put("/customers/:id", updateCustomerById);

export default router;
