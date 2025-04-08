import express from "express";
import {
  getAllTailors,
  getTailorById,
  getTailorReviews,
  updateTailorById,
} from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/tailors", getAllTailors);
router.get("/tailors/:id", getTailorById);
router.get("/tailors/:id/reviews", getTailorReviews);
router.put("/tailors/:id", updateTailorById);

export default router;
