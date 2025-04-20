import express from "express";
import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  updateInventoryItem,
} from "../controllers/inventory.controller.js";
import { isTailor } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Routes for inventory management
router.get("/", verifyToken, isTailor, getAllInventory);
router.post("/", verifyToken, isTailor, createInventoryItem);
router.put("/:id", verifyToken, isTailor, updateInventoryItem);
router.delete("/:id", verifyToken, isTailor, deleteInventoryItem);

export default router;
