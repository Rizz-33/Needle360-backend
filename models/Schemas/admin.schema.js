import mongoose from "mongoose";
import ROLES from "../../constants.js";
import BaseUser from "../base-user.model.js";

const adminSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: ROLES.ADMIN,
      required: true,
    },
    privileges: {
      type: [String],
      default: [],
    },
  },
  { collection: `users.${ROLES.ADMIN}` }
);

const Admin = BaseUser.discriminator("Admin", adminSchema);

export default Admin;
