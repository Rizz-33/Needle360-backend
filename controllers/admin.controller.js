import mongoose from "mongoose";
import ROLES from "../constants.js";

export const approveTailorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID format" });
    }

    const db = mongoose.connection.db;

    // Find the tailor first to verify they exist and are unapproved
    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
      isApproved: false,
    });

    if (!tailor) {
      return res.status(404).json({
        message: "Unapproved tailor not found or already approved",
      });
    }

    // Update the tailor's approval status
    const result = await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: req.user ? req.user._id : null, // Assuming req.user exists from auth middleware
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to approve tailor" });
    }

    // Get the updated tailor information
    const updatedTailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    // Remove sensitive data
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      ...tailorDetails
    } = updatedTailor;

    res.status(200).json({
      message: "Tailor approved successfully",
      tailor: tailorDetails,
    });
  } catch (error) {
    console.error("Error approving tailor:", error);
    res.status(500).json({
      message: "Error approving tailor",
      error: error.message,
    });
  }
};
