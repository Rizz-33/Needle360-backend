import mongoose from "mongoose";
import ROLES from "../constants.js";

export const isAdmin = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;

    // Find the user with the ID from the token verification
    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(req.userId),
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set the user in the request for later use
    req.user = user;

    // Check if the user has an admin role
    if (user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        message: "Admin access required for this operation",
      });
    }

    // If the user is an admin, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in admin authorization:", error);
    res.status(500).json({
      message: "Error checking admin privileges",
      error: error.message,
    });
  }
};

export const isTailor = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;

    // Find the user with the ID from the token verification
    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(req.userId),
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set the user in the request for later use
    req.user = user;

    // Check if the user has a tailor role
    if (user.role !== ROLES.TAILOR_SHOP_OWNER) {
      return res.status(403).json({
        message: "Tailor access required for this operation",
      });
    }

    // If the user is a tailor, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in tailor authorization:", error);
    res.status(500).json({
      message: "Error checking tailor privileges",
      error: error.message,
    });
  }
};
