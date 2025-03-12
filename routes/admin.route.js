import express from "express";
import { approveTailorById } from "../controllers/admin.controller.js";
import { isAdmin } from "../middleware/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.patch("/tailors/:id/approve", verifyToken, isAdmin, approveTailorById);

export default router;
