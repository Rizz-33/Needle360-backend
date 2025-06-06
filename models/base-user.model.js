import mongoose from "mongoose";
import ROLES from "../constants.js";

const baseUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    role: {
      type: Number,
      required: true,
      enum: [ROLES.ADMIN, ROLES.TAILOR_SHOP_OWNER, ROLES.USER],
    },
    registrationNumber: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetPassWordToken: String,
    resetPassWordExpires: Date,
    verificationToken: String,
    verificationTokenExpires: Date,
    isApproved: Boolean,
  },
  {
    timestamps: true,
    collection: "users",
    discriminatorKey: "role",
  }
);

const BaseUser = mongoose.model("BaseUser", baseUserSchema);

export default BaseUser;
