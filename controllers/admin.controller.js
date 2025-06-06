import mongoose from "mongoose";
import ROLES from "../constants.js";
import { sendWelcomeEmail } from "../mailtrap/emails.js";

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
          approvedBy: req.user ? req.user._id : null,
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

    // Send welcome email to approved tailor
    try {
      await sendWelcomeEmail(updatedTailor.email, updatedTailor.name);
    } catch (emailError) {
      console.error(
        "Failed to send welcome email to approved tailor:",
        emailError
      );
    }

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

export const getUnapprovedTailors = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({
        role: ROLES.TAILOR_SHOP_OWNER,
        isApproved: false,
      })
      .toArray();

    res.status(200).json(tailors);
  } catch (error) {
    console.error("Error fetching unapproved tailors:", error);
    res.status(500).json({ message: "Error fetching unapproved tailors" });
  }
};

export const getUnapprovedTailorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID format" });
    }

    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
      isApproved: false,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Unapproved tailor not found" });
    }

    // Remove sensitive data
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      ...tailorDetails
    } = tailor;

    res.status(200).json(tailorDetails);
  } catch (error) {
    console.error("Error fetching unapproved tailor:", error);
    res.status(500).json({
      message: "Error fetching unapproved tailor",
      error: error.message,
    });
  }
};
