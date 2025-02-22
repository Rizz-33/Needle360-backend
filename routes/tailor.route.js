import express from "express";
import { getAllTailors, getTailorShopLogos } from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/logos", getTailorShopLogos);
router.get("/tailors", getAllTailors);

export default router;
