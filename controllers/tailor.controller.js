import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getTailorShopLogos = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const shops = await db
      .collection("users")
      .find({
        role: ROLES.TAILOR_SHOP_OWNER,
        logoUrl: { $exists: true, $ne: null },
      })
      .project({ logoUrl: 1, shopName: 1 })
      .toArray();

    res.json(shops);
  } catch (error) {
    console.error("Error fetching logos:", error); // Log the error
    res
      .status(500)
      .json({ message: "Error fetching logos", error: error.message });
  }
};
