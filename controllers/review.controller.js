import mongoose from "mongoose";

// Create a new review for a user (either customer or tailor)
export const createReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { clientId, rating, comment } = req.body;

    // Validate input
    if (!rating || !clientId) {
      return res
        .status(400)
        .json({ message: "Rating and clientId are required" });
    }

    // Convert rating to number if it's a string
    const numericRating = Number(rating);
    if (isNaN(numericRating)) {
      return res.status(400).json({ message: "Rating must be a number" });
    }

    // Connect to the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Convert userId to ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId.toString());
    } catch (error) {
      console.error("Invalid userId format:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find the user in the users collection
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the user's role (1 = Customer, 4 = Tailor)
    const role = user.role;
    console.log(`User role is: ${role} (type: ${typeof role})`);

    if (role !== 1 && role !== 4) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    // Create new review
    const newReview = {
      _id: new mongoose.Types.ObjectId(),
      clientId: new mongoose.Types.ObjectId(clientId.toString()),
      rating: numericRating,
      comment: comment || "",
      date: new Date(),
    };

    console.log(`Created new review: ${JSON.stringify(newReview)}`);

    // Update user document by adding the review
    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      { $push: { reviews: newReview } }
    );

    console.log(
      `Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .json({ message: "Review could not be added (no modification)" });
    }

    // For tailors (role 4), update the average rating
    if (role === 4) {
      // Get the updated document to calculate new average
      const updatedUser = await usersCollection.findOne({ _id: userObjectId });
      const reviews = updatedUser.reviews || [];

      // Calculate new average rating
      let newRating = 0;
      if (reviews.length > 0) {
        const totalRatings = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        newRating = totalRatings / reviews.length;
      }

      console.log(`Updating user's rating to ${newRating}`);

      // Update the ratings field
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: { ratings: newRating } }
      );
    }

    return res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Get all reviews for a specific user
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    // Direct database lookup
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId.toString()),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the user's role (1 = Customer, 4 = Tailor)
    if (user.role !== 1 && user.role !== 4) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    return res.status(200).json({
      reviews: user.reviews || [],
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific review by ID
export const getReviewById = async (req, res) => {
  try {
    const { userId, reviewId } = req.params;

    // Direct database lookup
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the user's role (1 = Customer, 4 = Tailor)
    if (user.role !== 1 && user.role !== 4) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    // Find the specific review
    const review = (user.reviews || []).find(
      (r) => r._id.toString() === reviewId
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.status(200).json({
      review,
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { userId, reviewId } = req.params;
    const { rating, comment } = req.body;

    // Direct database lookup
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the user's role (1 = Customer, 4 = Tailor)
    if (user.role !== 1 && user.role !== 4) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    // Find the specific review
    const reviewIndex = (user.reviews || []).findIndex(
      (r) => r._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update review fields
    const updateFields = {};

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating)) {
        return res.status(400).json({ message: "Rating must be a number" });
      }
      updateFields[`reviews.${reviewIndex}.rating`] = numericRating;
    }

    if (comment !== undefined) {
      updateFields[`reviews.${reviewIndex}.comment`] = comment;
    }

    updateFields[`reviews.${reviewIndex}.date`] = new Date();

    // Update the document
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId.toString()) },
      { $set: updateFields }
    );

    // For tailors (role 4), update the average rating
    if (user.role === 4) {
      // Get the updated document to calculate new average
      const updatedUser = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(userId.toString()),
      });
      const reviews = updatedUser.reviews || [];

      // Calculate new average rating
      let newRating = 0;
      if (reviews.length > 0) {
        const totalRatings = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        newRating = totalRatings / reviews.length;
      }

      // Update the ratings field
      await usersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(userId.toString()) },
        { $set: { ratings: newRating } }
      );
    }

    // Get the updated review
    const updatedUser = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });
    const updatedReview = updatedUser.reviews[reviewIndex];

    return res.status(200).json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { userId, reviewId } = req.params;

    // Direct database lookup
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the user's role (1 = Customer, 4 = Tailor)
    if (user.role !== 1 && user.role !== 4) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    // Remove the review from the array
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId.toString()) },
      {
        $pull: {
          reviews: { _id: new mongoose.Types.ObjectId(reviewId.toString()) },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "User not found or review not deleted" });
    }

    // For tailors (role 4), update the average rating
    if (user.role === 4) {
      // Get the updated document to calculate new average
      const updatedUser = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      });
      const reviews = updatedUser.reviews || [];

      // Calculate new average rating
      let newRating = 0;
      if (reviews.length > 0) {
        const totalRatings = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        newRating = totalRatings / reviews.length;
      }

      // Update the ratings field
      await usersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { ratings: newRating } }
      );
    }

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
