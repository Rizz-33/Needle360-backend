import express from "express";
import { getTailorShopLogos } from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/logos", getTailorShopLogos);

export default router;
