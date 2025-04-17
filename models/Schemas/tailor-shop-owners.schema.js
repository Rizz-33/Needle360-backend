import mongoose from "mongoose";
import ROLES from "../../constants.js";
import BaseUser from "../base-user.model.js";

const tailorShopOwnerSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    shopAddress: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    shopRegistrationNumber: {
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
    logoUrl: {
      type: String,
      required: true,
    },
    privileges: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    offers: {
      type: [
        {
          title: String,
          description: String,
          percentage: Number,
          startDate: Date,
          endDate: Date,
          image: String,
        },
      ],
      default: [],
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
    availability: {
      type: [
        {
          _id: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString(),
          },
          day: {
            type: String,
            enum: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            required: true,
          },
          from: {
            type: Date,
            required: true,
          },
          to: {
            type: Date,
            required: true,
          },
          isOpen: {
            type: Boolean,
            default: true,
          },
          status: {
            type: String,
            enum: ["available", "busy", "break"],
            default: "available",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    address: {
      type: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
      },
      default: {},
    },
    services: {
      type: [String],
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
    ratings: {
      type: Number,
      default: 0,
    },
  },
  { collection: `users.${ROLES.TAILOR_SHOP_OWNER}` }
);

const TailorShopOwner = BaseUser.discriminator(
  "TailorShopOwner",
  tailorShopOwnerSchema
);

export default TailorShopOwner;
