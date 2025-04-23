import mongoose from "mongoose";
import validator from "validator";
import { ORDER_STATUSES, PREDEFINED_SERVICES } from "../constants.js";

const orderSchema = new mongoose.Schema({
  tailorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BaseUser",
    required: true,
    index: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BaseUser",
    required: true,
    index: true,
  },
  customerContact: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => validator.isMobilePhone(value, "any"),
      message: "Invalid phone number",
    },
  },
  orderType: {
    type: String,
    required: true,
    enum: PREDEFINED_SERVICES,
  },
  measurements: {
    type: Map,
    of: String,
    default: {},
  },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: "requested",
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value >= new Date(),
      message: "Due date must be in the future",
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
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

// Compound index for common queries
orderSchema.index({ tailorId: 1, status: 1 });
orderSchema.index({ customerId: 1, status: 1 });

// Update `updatedAt` on save
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Order", orderSchema);
