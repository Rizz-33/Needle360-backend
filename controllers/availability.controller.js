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

  try {
    new Date(availability.from);
    new Date(availability.to);
  } catch (error) {
    return {
      isValid: false,
      message: "Invalid date format for 'from' or 'to'.",
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
    const tailor = await db
      .collection("users")
      .findOne(
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

// Create a new availability slot for a specific tailor
export const createTailorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const availabilityValidation = validateAvailabilityData(availability);
    if (!availabilityValidation.isValid) {
      return res.status(400).json({ message: availabilityValidation.message });
    }

    // Generate a unique ID for the availability slot
    const availabilityId = uuidv4();
    const newAvailability = {
      _id: availabilityId,
      ...availability,
      status: availability.status || "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = mongoose.connection.db;
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id.toString()),
          role: ROLES.TAILOR_SHOP_OWNER,
        },
        { $push: { availability: newAvailability } },
        { returnDocument: "after" }
      );

    // In newer versions of MongoDB, the result structure has changed
    const tailor = result.value || result;

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.status(201).json({ availability: newAvailability });
  } catch (error) {
    console.error("Error creating tailor availability:", error);
    res.status(500).json({
      message: "Error creating tailor availability",
      error: error.message,
    });
  }
};

// Update an existing availability slot for a specific tailor
export const updateTailorAvailability = async (req, res) => {
  try {
    const { id, availabilityId } = req.params;
    const { availability } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const availabilityValidation = validateAvailabilityData(availability);
    if (!availabilityValidation.isValid) {
      return res.status(400).json({ message: availabilityValidation.message });
    }

    const updateData = {
      ...availability,
      updatedAt: new Date(),
    };

    const db = mongoose.connection.db;
    const result = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id.toString()),
        role: ROLES.TAILOR_SHOP_OWNER,
        "availability._id": availabilityId,
      },
      {
        $set: {
          "availability.$": {
            ...updateData,
            _id: availabilityId, // Keep the original _id
          },
        },
      },
      { returnDocument: "after" }
    );

    // In newer versions of MongoDB, the result structure has changed
    const tailor = result.value || result;

    if (!tailor) {
      return res
        .status(404)
        .json({ message: "Tailor or availability slot not found" });
    }

    // Find the updated availability in the response
    const updatedAvailability = tailor.availability
      ? tailor.availability.find((a) => a._id === availabilityId)
      : null;

    if (!updatedAvailability) {
      return res
        .status(404)
        .json({ message: "Availability slot not found after update" });
    }

    res.json({ availability: updatedAvailability });
  } catch (error) {
    console.error("Error updating tailor availability:", error);
    res.status(500).json({
      message: "Error updating tailor availability",
      error: error.message,
    });
  }
};

// Delete a specific availability slot for a tailor
export const deleteTailorAvailability = async (req, res) => {
  try {
    const { id, availabilityId } = req.params;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const db = mongoose.connection.db;
    const result = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id.toString()),
        role: ROLES.TAILOR_SHOP_OWNER,
        "availability._id": availabilityId,
      },
      { $pull: { availability: { _id: availabilityId } } },
      { returnDocument: "after" }
    );

    // In newer versions of MongoDB, the result structure has changed
    const tailor = result.value || result;

    if (!tailor) {
      return res
        .status(404)
        .json({ message: "Tailor or availability slot not found" });
    }

    res.json({ message: "Availability slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting tailor availability:", error);
    res.status(500).json({
      message: "Error deleting tailor availability",
      error: error.message,
    });
  }
};
