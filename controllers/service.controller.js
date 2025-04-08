import mongoose from "mongoose";
import ROLES from "../constants.js";

/**
 * Get all services for a specific tailor
 */
export const getTailorServices = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const db = mongoose.connection.db;

    // Fetch only the services field
    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      { projection: { services: 1 } }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Return the services array in the requested format
    res.json({ services: tailor.services || [] });
  } catch (error) {
    console.error("Error fetching tailor services:", error);
    res.status(500).json({
      message: "Error fetching tailor services",
      error: error.message,
    });
  }
};

/**
 * Add services to a tailor's services list
 */
export const addTailorServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    // Validate service data
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        message: "Invalid services data. Services must be a non-empty array.",
      });
    }

    // Validate each service
    for (const service of services) {
      if (typeof service !== "string" || service.trim() === "") {
        return res
          .status(400)
          .json({ message: "Each service must be a non-empty string." });
      }
    }

    const db = mongoose.connection.db;

    // Check if tailor exists
    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Add services to tailor's services array (only adds services that don't already exist)
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $addToSet: { services: { $each: services } } }
      );

    // Get updated services list
    const updatedTailor = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { projection: { services: 1 } }
      );

    res.status(201).json({ services: updatedTailor.services });
  } catch (error) {
    console.error("Error adding tailor services:", error);
    res
      .status(500)
      .json({ message: "Error adding tailor services", error: error.message });
  }
};

/**
 * Update multiple services for a tailor
 */
export const updateTailorServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    // Validate services data
    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ message: "Services must be an array" });
    }

    // Validate each service is a non-empty string
    for (const service of services) {
      if (typeof service !== "string" || service.trim() === "") {
        return res.status(400).json({
          message:
            "Invalid service data. Each service must be a non-empty string.",
        });
      }
    }

    const db = mongoose.connection.db;

    // Check if tailor exists
    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Replace all services
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { services: services } }
      );

    res.json({ services: services });
  } catch (error) {
    console.error("Error updating all tailor services:", error);
    res.status(500).json({
      message: "Error updating all tailor services",
      error: error.message,
    });
  }
};

/**
 * Delete all services for a tailor
 */
export const deleteTailorServices = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const db = mongoose.connection.db;

    // Check if tailor exists first
    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Set services to an empty array
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { services: [] } }
      );

    // Return empty services array
    res.json({ services: [] });
  } catch (error) {
    console.error("Error deleting tailor services:", error);
    res.status(500).json({
      message: "Error deleting tailor services",
      error: error.message,
    });
  }
};
