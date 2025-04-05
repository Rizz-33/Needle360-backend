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

    res.json(tailor.availability || []);
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

    // Generate new slots with unique IDs
    const newSlots = slots.map((slot) => ({
      _id: uuidv4(),
      day: slot.day,
      from: new Date(`1970-01-01T${slot.from}:00`),
      to: new Date(`1970-01-01T${slot.to}:00`),
      isOpen: slot.isOpen,
      status: slot.status || "available",
      createdAt: new Date(),
      updatedAt: new Date(),
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

    res.status(201).json({ slots: newSlots });
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

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id.toString()),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Prepare bulk write operations
    const bulkOps = updates.map((update) => {
      const { slotId, ...updateData } = update;
      return {
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(id.toString()),
            "availability._id": slotId,
          },
          update: {
            $set: {
              "availability.$": {
                ...updateData,
                _id: slotId,
                from: new Date(`1970-01-01T${updateData.from}:00`),
                to: new Date(`1970-01-01T${updateData.to}:00`),
                updatedAt: new Date(),
              },
            },
          },
        },
      };
    });

    await db.collection("users").bulkWrite(bulkOps);

    // Fetch updated availability
    const updatedTailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id.toString()),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    res.json({
      slots: updatedTailor?.availability || [],
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

    // In newer versions of MongoDB, the result structure has changed
    const tailor = result.value || result;

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

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
