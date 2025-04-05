import express from "express";
import {
  createTailorAvailability,
  deleteTailorAvailability,
  getTailorAvailability,
  updateTailorAvailability,
} from "../controllers/availability.controller.js";

const router = express.Router();

router.get("/:id", getTailorAvailability);
router.post("/:id", createTailorAvailability);
router.put(
  "/tailors/:id/availability/:availabilityId",
  updateTailorAvailability
);
router.delete(
  "/tailors/:id/availability/:availabilityId",
  deleteTailorAvailability
);

export default router;
