import express from "express";
import {
  createReview,
  deleteReview,
  getReviewById,
  getUserReviews,
  updateReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/:userId/reviews", createReview);
router.get("/:userId/reviews", getUserReviews);
router.get("/:userId/reviews/:reviewId", getReviewById);
router.put("/:userId/reviews/:reviewId", updateReview);
router.delete("/:userId/reviews/:reviewId", deleteReview);

export default router;
