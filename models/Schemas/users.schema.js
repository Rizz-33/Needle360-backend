import mongoose from "mongoose";
import BaseUser from "../user.model";

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    default: "user",
    required: true,
  },
});

const User = BaseUser.discriminator("users", userSchema);

export default User;
