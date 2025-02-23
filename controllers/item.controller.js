import mongoose from "mongoose";
import Item from "../models/item.model.js";

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a new item
export const createItem = async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res
      .status(500)
      .json({ message: "Error creating item", error: error.message });
  }
};

// Get all items
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res
      .status(500)
      .json({ message: "Error fetching items", error: error.message });
  }
};

// Get an item by ID, shopName, or name
export const getItemById = async (req, res) => {
  try {
    const identifier = req.params.id;
    let item;

    if (isValidObjectId(identifier)) {
      item = await Item.findById(identifier);
    } else {
      item = await Item.findOne({
        shopName: { $regex: new RegExp(`^${identifier}$`, "i") },
      });
      if (!item) {
        item = await Item.findOne({
          name: { $regex: new RegExp(`^${identifier}$`, "i") },
        });
      }
    }

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res
      .status(500)
      .json({ message: "Error fetching item", error: error.message });
  }
};

// Get an item by shopName
export const getItemByShopName = async (req, res) => {
  try {
    const { shopName } = req.params;
    const item = await Item.findOne({
      shopName: { $regex: new RegExp(`^${shopName}$`, "i") },
    });

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    console.error("Error fetching item by shopName:", error);
    res
      .status(500)
      .json({
        message: "Error fetching item by shopName",
        error: error.message,
      });
  }
};

// Get an item by name
export const getItemByName = async (req, res) => {
  try {
    const { name } = req.params;
    const item = await Item.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    console.error("Error fetching item by name:", error);
    res
      .status(500)
      .json({ message: "Error fetching item by name", error: error.message });
  }
};

// Update an item by ID
export const updateItem = async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res
      .status(500)
      .json({ message: "Error updating item", error: error.message });
  }
};

// Delete an item by ID
export const deleteItem = async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res
      .status(500)
      .json({ message: "Error deleting item", error: error.message });
  }
};
