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

// Utility function to validate design data
const validateDesignData = (design) => {
  if (!design || typeof design !== "object") {
    return {
      isValid: false,
      message: "Design data is required and must be an object.",
    };
  }

  if (design.itemName) {
    if (typeof design.itemName !== "string") {
      return {
        isValid: false,
        message: "itemName is required and must be a string.",
      };
    }
    if (typeof design.price !== "number") {
      return {
        isValid: false,
        message: "price is required and must be a number.",
      };
    }
  } else if (design.title) {
    if (typeof design.title !== "string") {
      return {
        isValid: false,
        message: "title is required and must be a string.",
      };
    }
    if (typeof design.description !== "string") {
      return {
        isValid: false,
        message: "description is required and must be a string.",
      };
    }
  } else {
    return {
      isValid: false,
      message: "Design must contain either itemName or title.",
    };
  }

  return { isValid: true };
};

export const getAllTailorDesigns = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({ role: ROLES.TAILOR_SHOP_OWNER }, { projection: { designs: 1 } })
      .toArray();

    const allDesigns = tailors.flatMap((tailor) => tailor.designs || []);
    res.json(allDesigns);
  } catch (error) {
    console.error("Error fetching all tailor designs:", error);
    res.status(500).json({
      message: "Error fetching all tailor designs",
      error: error.message,
    });
  }
};

export const getTailorDesignsById = async (req, res) => {
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
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
        { projection: { designs: 1 } }
      );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.json(tailor.designs || []);
  } catch (error) {
    console.error("Error fetching tailor designs:", error);
    res.status(500).json({
      message: "Error fetching tailor designs",
      error: error.message,
    });
  }
};

export const createTailorDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { design } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const designValidation = validateDesignData(design);
    if (!designValidation.isValid) {
      return res.status(400).json({ message: designValidation.message });
    }

    const designId = uuidv4();
    const newDesign = { ...design, id: designId };

    const db = mongoose.connection.db;
    const tailor = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
        { $push: { designs: newDesign } },
        { returnDocument: "after" }
      );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.status(201).json({ design: newDesign });
  } catch (error) {
    console.error("Error creating tailor design:", error);
    res.status(500).json({
      message: "Error creating tailor design",
      error: error.message,
    });
  }
};

export const updateTailorDesign = async (req, res) => {
  try {
    const { id, designId } = req.params;
    const { design } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const designValidation = validateDesignData(design);
    if (!designValidation.isValid) {
      return res.status(400).json({ message: designValidation.message });
    }

    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
        "designs.id": designId,
      },
      { $set: { "designs.$": { ...design, id: designId } } },
      { returnDocument: "after" }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor or design not found" });
    }

    res.json({ design: { ...design, id: designId } });
  } catch (error) {
    console.error("Error updating tailor design:", error);
    res.status(500).json({
      message: "Error updating tailor design",
      error: error.message,
    });
  }
};

export const deleteTailorDesign = async (req, res) => {
  try {
    const { id, designId } = req.params;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
        "designs.id": designId,
      },
      { $pull: { designs: { id: designId } } },
      { returnDocument: "after" }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor or design not found" });
    }

    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting tailor design:", error);
    res.status(500).json({
      message: "Error deleting tailor design",
      error: error.message,
    });
  }
};
