import mongoose from "mongoose";
import BaseUser from "../user.model";

const tailorShopOwnerSchema = new mongoose.Schema({
  role: {
    type: String,
    default: "tailor-shop-owner",
    required: true,
  },
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
});

const TailorShopOwner = BaseUser.discriminator(
  "tailor-shop=owners",
  tailorShopOwnerSchema
);

export default TailorShopOwner;
