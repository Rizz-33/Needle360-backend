import { validationResult } from "express-validator";
import mongoose from "mongoose";
import inventorySchema from "../models/inventory.model.js";

// Get all inventory items for the authenticated tailor
export const getAllInventory = async (req, res) => {
  try {
    const { type, isLowStock, page = 1, limit = 10 } = req.query;
    const query = { tailorId: req.user._id };
    if (type) query.type = type;
    if (isLowStock === "true") {
      query.quantity = { $lte: mongoose.expr.$fromField("lowStockThreshold") };
    }

    const inventory = await inventorySchema
      .find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await inventorySchema.countDocuments(query);

    // Convert ObjectId to string in response
    const sanitizedInventory = inventory.map((item) => ({
      ...item.toObject(),
      _id: item._id.toString(),
      tailorId: item.tailorId.toString(),
    }));

    res.json({ inventory: sanitizedInventory, total, page, limit });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res
      .status(500)
      .json({ message: "Error fetching inventory", error: error.message });
  }
};

// Add a new inventory item
export const createInventoryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const itemData = {
      ...req.body,
      tailorId: req.user._id,
    };

    const item = new inventorySchema(itemData);
    await item.save();

    // Convert ObjectId to string in response
    const sanitizedItem = {
      ...item.toObject(),
      _id: item._id.toString(),
      tailorId: item.tailorId.toString(),
    };

    res.status(201).json(sanitizedItem);
  } catch (error) {
    console.error("Error adding inventory item:", error);
    res
      .status(400)
      .json({ message: "Error adding inventory item", error: error.message });
  }
};

// Update an inventory item
export const updateInventoryItem = async (req, res) => {
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
      return res.status(400).json({ message: "Invalid inventory item ID" });
    }

    const item = await inventorySchema.findOneAndUpdate(
      { _id: id, tailorId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Convert ObjectId to string in response
    const sanitizedItem = {
      ...item.toObject(),
      _id: item._id.toString(),
      tailorId: item.tailorId.toString(),
    };

    res.json(sanitizedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(400).json({
      message: "Error updating inventory item",
      error: error.message,
    });
  }
};

// Delete an inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory item ID" });
    }

    const item = await inventorySchema.findOneAndDelete({
      _id: id,
      tailorId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(400).json({
      message: "Error deleting inventory item",
      error: error.message,
    });
  }
};
