import mongoose from "mongoose";
import ROLES from "../../constants.js";
import BaseUser from "../base-user.model.js";

const tailorShopOwnerSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: ROLES.TAILOR_SHOP_OWNER,
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
  { collection: `users.${ROLES.TAILOR_SHOP_OWNER}` }
);

const TailorShopOwner = BaseUser.discriminator(
  "TailorShopOwner",
  tailorShopOwnerSchema
);

export default TailorShopOwner;
