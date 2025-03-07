import mongoose from "mongoose";
import ROLES from "../constants.js";

const validateLogoUrl = (url) => {
  if (!url) return "/images/default-logo.png";

  if (url.match(/^https?:\/\//)) {
    return url;
  }

  if (url.startsWith("data:")) {
    return url;
  }

  if (!url.startsWith("/")) {
    return `/${url}`;
  }

  return url;
};

export const getAllTailors = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tailors = await db
      .collection("users")
      .find({ role: ROLES.TAILOR_SHOP_OWNER })
      .project({
        _id: 1,
        email: 1,
        name: 1,
        shopName: 1,
        contactNumber: 1,
        logoUrl: 1,
        shopAddress: 1,
      })
      .toArray();

    const sanitizedTailors = tailors.map((tailor) => ({
      ...tailor,
      logoUrl: validateLogoUrl(tailor.logoUrl),
    }));

    res.json(sanitizedTailors);
  } catch (error) {
    console.error("Error fetching tailors:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailors", error: error.message });
  }
};

export const getTailorById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;

    const tailor = await db.collection("users").findOne(
      { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
      {
        projection: {
          _id: 1,
          email: 1,
          name: 1,
          shopName: 1,
          contactNumber: 1,
          logoUrl: 1,
          shopAddress: 1,
          shopRegistrationNumber: 1,
          bankAccountNumber: 1,
          bankName: 1,
          privileges: 1,
          bio: 1,
          offers: 1,
          designs: 1,
          availability: 1,
          services: 1,
          reviews: 1,
          ratings: 1,
        },
      }
    );

    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    const sanitizedTailor = {
      ...tailor,
      logoUrl: validateLogoUrl(tailor.logoUrl),
    };

    res.json(sanitizedTailor);
  } catch (error) {
    console.error("Error fetching tailor:", error);
    res
      .status(500)
      .json({ message: "Error fetching tailor", error: error.message });
  }
};

export const updateTailorById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if ("logoUrl" in updateData) {
      updateData.logoUrl = validateLogoUrl(updateData.logoUrl);
    }

    const db = mongoose.connection.db;

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id), role: ROLES.TAILOR_SHOP_OWNER },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    const updatedTailor = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    updatedTailor.logoUrl = validateLogoUrl(updatedTailor.logoUrl);

    res.json(updatedTailor);
  } catch (error) {
    console.error("Error updating tailor profile:", error);
    res
      .status(500)
      .json({ message: "Error updating tailor profile", error: error.message });
  }
};
