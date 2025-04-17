import mongoose from "mongoose";
import ROLES from "../../constants.js";
import BaseUser from "../base-user.model.js";

const userSchema = new mongoose.Schema(
  {
    contactNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    designs: {
      type: [
        {
          itemName: { type: String, required: true },
          description: { type: String },
          price: { type: Number, required: true },
          imageURLs: [{ type: String }],
          tags: {
            type: [String],
            enum: [
              "School Uniforms",
              "Saree Blouses",
              "Wedding Attire",
              "Office Wear",
              "National Dress",
              "Formal Wear",
              "Casual Wear",
              "Kidswear",
              "Religious/Cultural Outfits",
              "Custom Fashion Designs",
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    reviews: {
      type: [
        {
          clientId: mongoose.Schema.Types.ObjectId,
          rating: Number,
          comment: String,
          date: Date,
        },
      ],
      default: [],
    },
    bankAccountNumber: {
      type: String,
      required: true,
    },
    bankName: {
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
