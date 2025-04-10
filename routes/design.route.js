import express from "express";
import {
  createCustomerDesign,
  createTailorDesign,
  deleteCustomerDesign,
  deleteTailorDesign,
  getAllCustomerDesigns,
  getAllDesigns,
  getAllTailorDesigns,
  getCustomerDesignsById,
  getTailorDesignsById,
  updateCustomerDesign,
  updateTailorDesign,
} from "../controllers/design.controller.js";

const router = express.Router();

// General routes
router.get("/", getAllDesigns);

// Tailor-specific routes
router.get("/tailors", getAllTailorDesigns);
router.get("/tailors/:id", getTailorDesignsById);
router.post("/tailors/:id", createTailorDesign);
router.put("/tailors/:id/designs/:designId", updateTailorDesign);
router.delete("/tailors/:id/designs/:designId", deleteTailorDesign);

// Customer-specific routes
router.get("/customers", getAllCustomerDesigns);
router.get("/customers/:id", getCustomerDesignsById);
router.post("/customers/:id", createCustomerDesign);
router.put("/customers/:id/designs/:designId", updateCustomerDesign);
router.delete("/customers/:id/designs/:designId", deleteCustomerDesign);

export default router;
