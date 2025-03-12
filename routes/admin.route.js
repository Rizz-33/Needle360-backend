import express from "express";
import {
  approveTailorById,
  getUnapprovedTailorById,
  getUnapprovedTailors,
} from "../controllers/admin.controller.js";
import { isAdmin } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.patch("/tailors/:id/approve", verifyToken, isAdmin, approveTailorById);
router.get("/unapproved-tailors", getUnapprovedTailors);
router.get("/unapproved-tailors/:id", getUnapprovedTailorById);

export default router;
