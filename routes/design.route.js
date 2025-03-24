import express from "express";
import {
  createTailorDesign,
  deleteTailorDesign,
  getAllTailorDesigns,
  getTailorDesignsById,
  updateTailorDesign,
} from "../controllers/design.controller.js";

const router = express.Router();

router.get("/", getAllTailorDesigns);
router.get("/:id", getTailorDesignsById);
router.post("/:id", createTailorDesign);
router.put("/:id/designs/:designId", updateTailorDesign);
router.delete("/:id/designs/:designId", deleteTailorDesign);

export default router;
