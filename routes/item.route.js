import express from "express";
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  getItemByName,
  getItemByShopName,
  updateItem,
} from "../controllers/item.controller.js";

const router = express.Router();

router.post("/", createItem);
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.get("/:shopName", getItemByShopName);
router.get("/:name", getItemByName);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
