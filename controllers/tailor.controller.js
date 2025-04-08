import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getAllTailors = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({ role: ROLES.TAILOR_SHOP_OWNER })
      .project({
        _id: 1,
        email: 1,
        name: 1,
        shopName: 1,
        contactNumber: 1,
        logoUrl: 1,
        shopAddress: 1,
      })
      .toArray();

    const sanitizedTailors = tailors.map((tailor) => ({
      ...tailor,
      _id: tailor._id.toString(), // Convert ObjectId to string
    }));

    res.json(sanitizedTailors);
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
    const excludeDesigns = req.query.excludeDesigns === "true";

    // Check if id is undefined or null
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Missing tailor ID" });
    }

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID format" });
    }

    const db = mongoose.connection.db;

    // Create projection based on whether to exclude designs
    const projection = {
      _id: 1,
      email: 1,
      name: 1,
      shopName: 1,
      contactNumber: 1,
      logoUrl: 1,
      shopAddress: 1,
      bio: 1,
      services: 1,
      // Only include designs if not excluded
      ...(excludeDesigns ? {} : { designs: 1 }),
    };

    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { projection }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.json({
      ...tailor,
      _id: tailor._id.toString(), // Convert ObjectId to string
    });
  } catch (error) {
    console.error("Error fetching tailor:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailor", error: error.message });
  }
};

export const getTailorAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const db = mongoose.connection.db;

    // Fetch only the availability field
    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { projection: { availability: 1 } }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Return the availability object or an empty object if no availability exists
    res.json(tailor.availability || {});
  } catch (error) {
    console.error("Error fetching tailor availability:", error);
    res.status(500).json({
      message: "Error fetching tailor availability",
      error: error.message,
    });
  }
};

export const getTailorReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const db = mongoose.connection.db;

    // Fetch only the reviews field
    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { projection: { reviews: 1 } }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Return the reviews array or an empty array if no reviews exist
    res.json(tailor.reviews || []);
  } catch (error) {
    console.error("Error fetching tailor reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailor reviews", error: error.message });
  }
};

export const updateTailorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const updateData = { ...req.body };

    const db = mongoose.connection.db;

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    const updatedTailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    // Convert ObjectId to string for response
    res.json({
      ...updatedTailor,
      _id: updatedTailor._id.toString(),
    });
  } catch (error) {
    console.error("Error updating tailor profile:", error);
    res
      .status(500)
      .json({ message: "Error updating tailor profile", error: error.message });
  }
};
