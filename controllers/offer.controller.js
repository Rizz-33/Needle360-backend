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

// Utility function to validate offer data
const validateOfferData = (offer) => {
  if (!offer || typeof offer !== "object") {
    return {
      isValid: false,
      message: "Offer data is required and must be an object.",
    };
  }

  if (typeof offer.title !== "string" || !offer.title.trim()) {
    return {
      isValid: false,
      message: "Title is required and must be a string.",
    };
  }

  if (typeof offer.description !== "string" || !offer.description.trim()) {
    return {
      isValid: false,
      message: "Description is required and must be a string.",
    };
  }

  if (
    offer.percentage &&
    (isNaN(offer.percentage) || offer.percentage < 0 || offer.percentage > 100)
  ) {
    return {
      isValid: false,
      message: "Percentage must be a number between 0 and 100.",
    };
  }

  if (offer.startDate && isNaN(new Date(offer.startDate).getTime())) {
    return {
      isValid: false,
      message: "Invalid start date format.",
    };
  }

  if (offer.endDate && isNaN(new Date(offer.endDate).getTime())) {
    return {
      isValid: false,
      message: "Invalid end date format.",
    };
  }

  return { isValid: true };
};

// Fetch all offers from all tailors
export const getAllTailorOffers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find(
        { role: ROLES.TAILOR_SHOP_OWNER },
        { projection: { offers: 1, _id: 1 } }
      )
      .toArray();

    // Add tailorId to each offer for frontend reference
    const allOffers = tailors.flatMap((tailor) =>
      (tailor.offers || []).map((offer) => ({
        ...offer,
        tailorId: tailor._id.toString(), // Convert ObjectId to string for frontend
      }))
    );

    res.json(allOffers);
  } catch (error) {
    console.error("Error fetching all tailor offers:", error);
    res.status(500).json({
      message: "Error fetching all tailor offers",
      error: error.message,
    });
  }
};

// Fetch all offers for a specific tailor by their ID
export const getTailorOffersById = async (req, res) => {
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
        { projection: { offers: 1 } }
      );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    // Add tailorId to each offer for frontend reference
    const offers = (tailor.offers || []).map((offer) => ({
      ...offer,
      tailorId: id, // Add the tailorId to each offer
      imageUrl: offer.image || null,
    }));

    res.json(offers);
  } catch (error) {
    console.error("Error fetching tailor offers:", error);
    res.status(500).json({
      message: "Error fetching tailor offers",
      error: error.message,
    });
  }
};

// Create a new offer for a specific tailor
export const createTailorOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offer } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const offerValidation = validateOfferData(offer);
    if (!offerValidation.isValid) {
      return res.status(400).json({ message: offerValidation.message });
    }

    const offerId = uuidv4();
    const newOffer = {
      _id: offerId,
      ...offer,
      tailorId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove any id field if it exists to avoid duplication
    delete newOffer.id;

    // Convert dates to Date objects if they exist
    if (newOffer.startDate) newOffer.startDate = new Date(newOffer.startDate);
    if (newOffer.endDate) newOffer.endDate = new Date(newOffer.endDate);

    const db = mongoose.connection.db;
    const tailor = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
        { $push: { offers: newOffer } },
        { returnDocument: "after" }
      );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    res.status(201).json({ offer: newOffer });
  } catch (error) {
    console.error("Error creating tailor offer:", error);
    res.status(500).json({
      message: "Error creating tailor offer",
      error: error.message,
    });
  }
};

// Update an existing offer for a specific tailor
export const updateTailorOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;
    const { offer } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const offerValidation = validateOfferData(offer);
    if (!offerValidation.isValid) {
      return res.status(400).json({ message: offerValidation.message });
    }

    const updateData = {
      ...offer,
      updatedAt: new Date(),
    };

    // Remove any id field if it exists to avoid duplication
    delete updateData.id;

    // Convert dates to Date objects if they exist
    if (updateData.startDate)
      updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const db = mongoose.connection.db;
    const result = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
        "offers._id": offerId,
      },
      {
        $set: {
          "offers.$": {
            ...updateData,
            _id: offerId, // Keep the original _id
            tailorId: id, // Keep the original tailorId
          },
        },
      },
      { returnDocument: "after" }
    );

    // In newer versions of MongoDB, the result structure has changed
    const tailor = result.value || result;

    if (!tailor) {
      return res.status(404).json({ message: "Tailor or offer not found" });
    }

    // Check if offers array exists
    if (!tailor.offers || !Array.isArray(tailor.offers)) {
      return res
        .status(404)
        .json({ message: "Offers array not found on tailor document" });
    }

    // Find the updated offer in the response with safer comparison
    const updatedOffer = tailor.offers.find((o) =>
      o && o._id && o._id.toString
        ? o._id.toString() === offerId
        : o._id === offerId
    );

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found after update" });
    }

    res.json({ offer: updatedOffer });
  } catch (error) {
    console.error("Error updating tailor offer:", error);
    res.status(500).json({
      message: "Error updating tailor offer",
      error: error.message,
    });
  }
};

// Delete a specific offer for a tailor
export const deleteTailorOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({ message: idValidation.message });
    }

    const db = mongoose.connection.db;
    const tailor = await db.collection("users").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        role: ROLES.TAILOR_SHOP_OWNER,
        "offers._id": offerId,
      },
      { $pull: { offers: { _id: offerId } } },
      { returnDocument: "after" }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor or offer not found" });
    }

    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting tailor offer:", error);
    res.status(500).json({
      message: "Error deleting tailor offer",
      error: error.message,
    });
  }
};
