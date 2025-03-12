import express from "express";
import {
  getAllTailors,
  getTailorById,
  getUnapprovedTailorById,
  getUnapprovedTailors,
  updateTailorById,
} from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/tailors", getAllTailors);
router.get("/tailors/:id", getTailorById);
router.put("/tailors/:id", updateTailorById);
router.get("/unapproved-tailors", getUnapprovedTailors);
router.get("/unapproved-tailors/:id", getUnapprovedTailorById);

export default router;
