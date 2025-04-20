import mongoose from "mongoose";
import ROLES, { PREDEFINED_SERVICES } from "../constants.js";

/**
 * Get all predefined services
 */
export const getAllServices = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Find all users with tailor role that have services
    const tailors = await db
      .collection("users")
      .find(
        {
          role: ROLES.TAILOR_SHOP_OWNER,
          services: { $exists: true, $ne: [] },
        },
        {
          projection: {
            _id: 1,
            shopName: 1,
            services: 1,
            email: 1,
            contactNumber: 1,
            shopAddress: 1,
            logoUrl: 1,
          },
        }
      )
      .toArray();

    res.json({
      services: PREDEFINED_SERVICES,
      count: PREDEFINED_SERVICES.length,
      tailors: tailors.map((tailor) => ({
        _id: tailor._id.toString(), // Use _id consistently
        shopName: tailor.shopName || "Unknown",
        services: tailor.services || [],
        servicesCount: tailor.services ? tailor.services.length : 0,
        email: tailor.email,
        contactNumber: tailor.contactNumber,
        shopAddress: tailor.shopAddress,
        logoUrl: tailor.logoUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching all services:", error);
    res.status(500).json({
      message: "Error fetching all services",
      error: error.message,
    });
  }
};

/**
 * Get all services for a specific tailor
 */
export const getTailorServices = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
      },
      {
        projection: {
          services: 1,
          shopName: 1,
          email: 1,
          contactNumber: 1,
          shopAddress: 1,
          logoUrl: 1,
        },
      }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.json({
      _id: tailor._id.toString(),
      shopName: tailor.shopName || "Unknown",
      services: tailor.services || [],
      email: tailor.email,
      contactNumber: tailor.contactNumber,
      shopAddress: tailor.shopAddress,
      logoUrl: tailor.logoUrl,
    });
  } catch (error) {
    console.error("Error fetching tailor services:", error);
    res.status(500).json({
      message: "Error fetching tailor services",
      error: error.message,
    });
  }
};

/**
 * Get tailors offering a specific service
 */
export const getTailorsByService = async (req, res) => {
  try {
    const { serviceName } = req.params;

    // Decode and normalize service name (trim and lowercase)
    const decodedServiceName = decodeURIComponent(serviceName).trim();
    const normalizedServiceName = decodedServiceName.toLowerCase();

    // Validate service name against PREDEFINED_SERVICES (case-insensitive)
    const matchedService = PREDEFINED_SERVICES.find(
      (service) => service.toLowerCase() === normalizedServiceName
    );

    if (!decodedServiceName || !matchedService) {
      return res.status(400).json({
        message: `Invalid service name. Must be one of: ${PREDEFINED_SERVICES.join(
          ", "
        )}`,
      });
    }

    const db = mongoose.connection.db;

    // Find tailors with the exact service (case-insensitive match)
    const tailors = await db
      .collection("users")
      .find(
        {
          role: ROLES.TAILOR_SHOP_OWNER,
          services: matchedService, // Use the exact service name from PREDEFINED_SERVICES
        },
        {
          projection: {
            _id: 1,
            shopName: 1,
            services: 1,
            email: 1,
            contactNumber: 1,
            shopAddress: 1,
            logoUrl: 1,
          },
        }
      )
      .toArray();

    console.log(
      `Fetched ${tailors.length} tailors for service "${matchedService}"`
    );

    res.json({
      service: matchedService,
      tailors: tailors.map((tailor) => ({
        _id: tailor._id.toString(),
        shopName: tailor.shopName || "Unknown",
        services: tailor.services || [],
        email: tailor.email,
        contactNumber: tailor.contactNumber,
        shopAddress: tailor.shopAddress,
        logoUrl: tailor.logoUrl,
      })),
      count: tailors.length,
    });
  } catch (error) {
    console.error("Error fetching tailors by service:", error);
    res.status(500).json({
      message: "Error fetching tailors by service",
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
    let { services } = req.body;

    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        message: "Invalid services data. Services must be a non-empty array.",
      });
    }

    // Normalize service names and validate
    services = services.map((service) => service.trim());
    for (const service of services) {
      if (!PREDEFINED_SERVICES.includes(service)) {
        return res.status(400).json({
          message: `Service "${service}" is not in the predefined services list.`,
          predefinedServices: PREDEFINED_SERVICES,
        });
      }
    }

    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $addToSet: { services: { $each: services } } }
      );

    const updatedTailor = await db.collection("users").findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        projection: {
          services: 1,
          shopName: 1,
          email: 1,
          contactNumber: 1,
          shopAddress: 1,
          logoUrl: 1,
        },
      }
    );

    res.status(201).json({
      _id: updatedTailor._id.toString(),
      shopName: updatedTailor.shopName || "Unknown",
      services: updatedTailor.services,
      email: updatedTailor.email,
      contactNumber: updatedTailor.contactNumber,
      shopAddress: updatedTailor.shopAddress,
      logoUrl: updatedTailor.logoUrl,
    });
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
    let { services } = req.body;

    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ message: "Services must be an array" });
    }

    // Normalize service names and validate
    services = services.map((service) => service.trim());
    for (const service of services) {
      if (!PREDEFINED_SERVICES.includes(service)) {
        return res.status(400).json({
          message: `Service "${service}" is not in the predefined services list.`,
          predefinedServices: PREDEFINED_SERVICES,
        });
      }
    }

    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { services: services } }
      );

    res.json({
      _id: tailor._id.toString(),
      shopName: tailor.shopName || "Unknown",
      services: services,
      email: tailor.email,
      contactNumber: tailor.contactNumber,
      shopAddress: tailor.shopAddress,
      logoUrl: tailor.logoUrl,
    });
  } catch (error) {
    console.error("Error updating all tailor services:", error);
    res.status(500).json({
      message: "Error updating all tailor services",
      error: error.message,
    });
  }
};

/**
 * Delete services from a tailor's services list
 */
export const deleteTailorServices = async (req, res) => {
  try {
    const { id } = req.params;
    let { services } = req.body;

    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid tailor ID" });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        message: "Invalid services data. Services must be a non-empty array.",
      });
    }

    // Normalize service names and validate
    services = services.map((service) => service.trim());
    for (const service of services) {
      if (!PREDEFINED_SERVICES.includes(service)) {
        return res.status(400).json({
          message: `Service "${service}" is not in the predefined services list.`,
          predefinedServices: PREDEFINED_SERVICES,
        });
      }
    }

    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: ROLES.TAILOR_SHOP_OWNER,
    });

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $pull: { services: { $in: services } } }
      );

    const updatedTailor = await db.collection("users").findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        projection: {
          services: 1,
          shopName: 1,
          email: 1,
          contactNumber: 1,
          shopAddress: 1,
          logoUrl: 1,
        },
      }
    );

    res.json({
      _id: updatedTailor._id.toString(),
      shopName: updatedTailor.shopName || "Unknown",
      services: updatedTailor.services,
      email: updatedTailor.email,
      contactNumber: updatedTailor.contactNumber,
      shopAddress: updatedTailor.shopAddress,
      logoUrl: updatedTailor.logoUrl,
    });
  } catch (error) {
    console.error("Error deleting tailor services:", error);
    res.status(500).json({
      message: "Error deleting tailor services",
      error: error.message,
    });
  }
};
