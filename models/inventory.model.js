import mongoose from "mongoose";
import { UNITS } from "../constants.js";

const inventorySchema = new mongoose.Schema({
  tailorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BaseUser",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (value) => Number.isInteger(value),
      message: "Quantity must be an integer",
    },
  },
  unit: {
    type: String,
    required: true,
    enum: UNITS,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0,
    validate: {
      validator: (value) => Number.isInteger(value),
      message: "Low stock threshold must be an integer",
    },
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field for low stock status
inventorySchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON output
inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

// Update `updatedAt` on save
inventorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Inventory", inventorySchema);
