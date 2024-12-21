import mongoose from "mongoose";
import BaseUser from "../user.model";

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    default: "user",
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  bankAccountNumber: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  bankBranch: {
    type: String,
    required: true,
  },
});

const User = BaseUser.discriminator("users", userSchema);

export default User;
