import mongoose from "mongoose";
import ROLES from "../constants.js";

export const getAllCustomers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const customers = await db
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
        profilePic: 1,
      })
      .toArray();

    const sanitizedCustomers = customers.map((customer) => ({
      ...customer,
      _id: customer._id.toString(), // Convert ObjectId to string
    }));

    res.json(sanitizedCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is undefined or null
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Missing customer ID" });
    }

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
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
      profilePic: 1,
    };

    const customer = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.USER,
      },
      { projection }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      ...customer,
      _id: customer._id.toString(), // Convert ObjectId to string
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res
      .status(500)
      .json({ message: "Error fetching customer", error: error.message });
  }
};

export const getCustomerReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const db = mongoose.connection.db;

    // Fetch only the reviews field
    const customer = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.USER,
      },
      { projection: { reviews: 1 } }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Return the reviews array or an empty array if no reviews exist
    res.json(customer.reviews || []);
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    res.status(500).json({
      message: "Error fetching customer reviews",
      error: error.message,
    });
  }
};

export const updateCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
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
      return res.status(404).json({ message: "Customer not found" });
    }

    const updatedCustomer = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    // Convert ObjectId to string for response
    res.json({
      ...updatedCustomer,
      _id: updatedCustomer._id.toString(),
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    res.status(500).json({
      message: "Error updating customer profile",
      error: error.message,
    });
  }
};
