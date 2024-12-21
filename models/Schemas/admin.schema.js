import mongoose from "mongoose";
import BaseUser from "../user.model";

const adminSchema = new mongoose.Schema({
  role: {
    type: String,
    default: "admin",
    required: true,
  },
  privileges: {
    type: [String],
    default: [],
  },
});

const Admin = BaseUser.discriminator("admin", adminSchema);

export default Admin;
