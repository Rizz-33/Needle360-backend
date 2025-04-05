import express from "express";
import {
  createBulkAvailability,
  deleteBulkAvailability,
  getTailorAvailability,
  updateBulkAvailability,
} from "../controllers/availability.controller.js";

const router = express.Router();

router.get("/:id", getTailorAvailability);
router.post("/:id", createBulkAvailability);
router.put("/tailors/:id/availability/:availabilityId", updateBulkAvailability);
router.delete(
  "/tailors/:id/availability/:availabilityId",
  deleteBulkAvailability
);

export default router;
