import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getAllTailors = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({ role: ROLES.TAILOR_SHOP_OWNER }) // Filter for tailor shop owners
      .project({
        email: 1,
        name: 1,
        shopName: 1,
        contactNumber: 1,
        logoUrl: 1,
        shopAddress: 1,
      })
      .toArray();

    res.json(tailors); // Respond with the list of tailors
  } catch (error) {
    console.error("Error fetching tailors:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailors", error: error.message });
  }
};

export const getTailorById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOne(
      { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER }, // Filter by ID and role
      {
        projection: {
          email: 1,
          name: 1,
          shopName: 1,
          contactNumber: 1,
          logoUrl: 1,
          shopAddress: 1,
        },
      }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" }); // Respond with 404 if tailor not found
    }

    res.json(tailor); // Respond with the tailor data
  } catch (error) {
    console.error("Error fetching tailor:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailor", error: error.message });
  }
};

export const updateTailorById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // New data sent in the request body

    const db = mongoose.connection.db;

    // Update the tailor's details
    const result = await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER }, // Filter by ID and role
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Fetch the updated tailor profile
    const updatedTailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    res.json(updatedTailor);
  } catch (error) {
    console.error("Error updating tailor profile:", error);
    res
      .status(500)
      .json({ message: "Error updating tailor profile", error: error.message });
  }
};
