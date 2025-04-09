import express from "express";
import {
  getAllUsers,
  getUserById,
  getUserReviews,
  updateUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users/:id/reviews", getUserReviews);
router.put("/users/:id", updateUserById);

export default router;
