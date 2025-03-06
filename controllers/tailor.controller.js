import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getAllTailors = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({ role: ROLES.TAILOR_SHOP_OWNER }) // Filter for tailor shop owners
      .project({
        email: 1, // Include the email
        name: 1, // Include the name
        shopName: 1, // Include the shop name
        contactNumber: 1, // Include the contact number
        logoUrl: 1, // Include the logo URL
        shopAddress: 1, // Include the shop address
      })
      .toArray();

    res.json(tailors); // Respond with the tailors data
  } catch (error) {
    console.error("Error fetching tailors:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Error fetching tailors", error: error.message });
  }
};
