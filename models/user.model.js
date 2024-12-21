import mongoose from "mongoose";

const baseUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    resetPassWordToken: String,
    resetPassWordExpires: Date,
    verificationToken: String,
    verificationTokenExpires: Date,
  },
  { timestamps: true }
);

const BaseUser = mongoose.model("User", baseUserSchema);

export default BaseUser;
