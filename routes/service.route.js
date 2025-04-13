import express from "express";
import {
  addTailorServices,
  deleteTailorServices,
  getAllServices,
  getTailorServices,
  updateTailorServices,
} from "../controllers/service.controller.js";

const router = express.Router();

router.get("/", getAllServices);
router.get("/:id", getTailorServices);
router.post("/:id", addTailorServices);
router.put("/:id", updateTailorServices);
router.delete("/:id", deleteTailorServices);

export default router;
