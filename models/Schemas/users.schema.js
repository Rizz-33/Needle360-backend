import mongoose from "mongoose";
import ROLES from "../../constants.js";
import BaseUser from "../base-user.model.js";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: ROLES.USER,
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
    privileges: {
      type: [String],
      default: [],
    },
  },
  { collection: `users.${ROLES.USER}` }
);

const User = BaseUser.discriminator("User", userSchema);

export default User;
