import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import ROLES from "../constants.js";

// Utility function to validate ObjectId
const validateObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return { isValid: false, message: "Invalid ID format" };
  }
  return { isValid: true };
};

// Utility function to validate time format (HH:MM)
const isValidTimeFormat = (time) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

// Utility function to get current UTC date
const getCurrentUTCDate = () => {
  return new Date();
};

// Utility function to validate availability data
const validateAvailabilityData = (availability) => {
  if (!availability || typeof availability !== "object") {
    return {
      isValid: false,
      message: "Availability data is required and must be an object.",
    };
  }

  if (!availability.day) {
    return {
      isValid: false,
      message: "Day is required.",
    };
  }

  const validDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  if (!validDays.includes(availability.day)) {
    return {
      isValid: false,
      message: "Day must be one of the valid weekdays.",
    };
  }

  if (!availability.from || !availability.to) {
    return {
      isValid: false,
      message: "Both 'from' and 'to' times are required.",
    };
  }

  if (
    !isValidTimeFormat(availability.from) ||
    !isValidTimeFormat(availability.to)
  ) {
    return {
      isValid: false,
      message: "Time must be in HH:MM format (24-hour clock).",
    };
  }

  if (typeof availability.isOpen !== "boolean") {
    return {
      isValid: false,
      message: "isOpen must be a boolean value.",
    };
  }

  return { isValid: true };
};

// Fetch all availability slots for a specific tailor
export const getTailorAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateObjectId(id);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id.toString()),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { projection: { availability: 1 } }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    const formattedAvailability =
      tailor.availability?.map((slot) => ({
        ...slot,
        from: slot.from,
        to: slot.to,
      })) || [];

    res.json(formattedAvailability);
  } catch (error) {
    console.error("Error fetching tailor availability:", error);
    res.status(500).json({
      message: "Error fetching tailor availability",
      error: error.message,
    });
  }
};

// Create multiple availability slots for a tailor
export const createBulkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;
    const currentUTCDate = getCurrentUTCDate();

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "Slots array is required" });
    }

    // Validate each slot
    for (const slot of slots) {
      const validation = validateAvailabilityData(slot);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    // Generate new slots with proper time handling and UTC date
    const newSlots = slots.map((slot) => ({
      _id: uuidv4(),
      day: slot.day,
      from: slot.from,
      to: slot.to,
      isOpen: slot.isOpen,
      status: slot.status || "available",
      createdAt: currentUTCDate,
      updatedAt: currentUTCDate,
    }));

    const db = mongoose.connection.db;
    const result = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id.toString()),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { $push: { availability: { $each: newSlots } } },
      { returnDocument: "after" }
    );

    const tailor = result.value || result;

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Return the full list of availability slots
    res.status(201).json({ slots: tailor.availability });
  } catch (error) {
    console.error("Error creating bulk availability:", error);
    res.status(500).json({
      message: "Error creating bulk availability",
      error: error.message,
    });
  }
};

// Update multiple availability slots
export const updateBulkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { updates } = req.body;

    const validation = validateObjectId(id);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    // Validate each update
    for (const update of updates) {
      const validation = validateAvailabilityData(update);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.message });
      }
      if (!update._id) {
        // Changed from update.id to update._id to match the frontend
        return res
          .status(400)
          .json({ message: "Slot ID is required for updates" });
      }
    }

    const db = mongoose.connection.db;
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(id),
          "availability._id": update._id, // Changed from update.id to update._id
        },
        update: {
          $set: {
            "availability.$.day": update.day,
            "availability.$.from": update.from,
            "availability.$.to": update.to,
            "availability.$.isOpen": update.isOpen,
            "availability.$.status": update.status || "available",
            "availability.$.updatedAt": new Date(),
          },
        },
      },
    }));

    console.log("Executing bulk operations:", bulkOps);
    const result = await db.collection("users").bulkWrite(bulkOps);
    console.log("Bulk write result:", result);

    // Fetch the updated document
    const updatedTailor = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { projection: { availability: 1 } }
      );

    if (!updatedTailor) {
      return res.status(404).json({ message: "Tailor not found after update" });
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      slots: updatedTailor.availability, // Return the full list of slots
    });
  } catch (error) {
    console.error("Error updating bulk availability:", error);
    res.status(500).json({
      message: "Error updating bulk availability",
      error: error.message,
    });
  }
};

// Delete multiple availability slots
export const deleteBulkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotIds } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ message: "Slot IDs array is required" });
    }

    const db = mongoose.connection.db;
    const result = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id.toString()),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { $pull: { availability: { _id: { $in: slotIds } } } },
      { returnDocument: "after" }
    );

    const tailor = result.value || result;

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Return the full list of remaining slots
    res.json({
      message: "Slots deleted successfully",
      slots: tailor.availability,
    });
  } catch (error) {
    console.error("Error deleting bulk availability:", error);
    res.status(500).json({
      message: "Error deleting bulk availability",
      error: error.message,
    });
  }
};
