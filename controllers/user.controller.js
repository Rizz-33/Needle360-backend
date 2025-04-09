import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getAllUsers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const users = await db
      .collection("users")
      .find({ role: ROLES.USER })
      .project({
        _id: 1,
        email: 1,
        name: 1,
        contactNumber: 1,
        address: 1,
        followers: 1,
        following: 1,
      })
      .toArray();

    const sanitizedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(), // Convert ObjectId to string
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is undefined or null
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Missing user ID" });
    }

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const db = mongoose.connection.db;

    const projection = {
      _id: 1,
      email: 1,
      name: 1,
      contactNumber: 1,
      address: 1,
      followers: 1,
      following: 1,
      registrationNumber: 1,
      privileges: 1,
      createdAt: 1,
      lastLogin: 1,
    };

    const user = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.USER,
      },
      { projection }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      ...user,
      _id: user._id.toString(), // Convert ObjectId to string
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const db = mongoose.connection.db;

    // Fetch only the reviews field
    const user = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.USER,
      },
      { projection: { reviews: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the reviews array or an empty array if no reviews exist
    res.json(user.reviews || []);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching user reviews", error: error.message });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updateData = { ...req.body };

    const db = mongoose.connection.db;

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.USER },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    // Convert ObjectId to string for response
    res.json({
      ...updatedUser,
      _id: updatedUser._id.toString(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Error updating user profile", error: error.message });
  }
};
