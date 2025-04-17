import express from "express";
import {
  addTailorServices,
  deleteTailorServices,
  getAllServices,
  getTailorsByService,
  getTailorServices,
  updateTailorServices,
} from "../controllers/service.controller.js";

const router = express.Router();

router.get("/", getAllServices);
router.get("/:id", getTailorServices);
router.get("/service/:serviceName", getTailorsByService);
router.post("/:id", addTailorServices);
router.put("/:id", updateTailorServices);
router.delete("/:id", deleteTailorServices);

export default router;
