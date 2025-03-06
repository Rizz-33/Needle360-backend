import express from "express";
import { getAllTailors } from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/tailors", getAllTailors);

export default router;
