import express from "express";
import {
  createTailorOffer,
  deleteTailorOffer,
  getAllTailorOffers,
  getTailorOffersById,
  updateTailorOffer,
} from "../controllers/offer.controller.js";

const router = express.Router();

router.get("/", getAllTailorOffers);
router.get("/:id", getTailorOffersById);
router.post("/:id", createTailorOffer);
router.put("/:id/offers/:offerId", updateTailorOffer);
router.delete("/:id/offers/:offerId", deleteTailorOffer);

export default router;
