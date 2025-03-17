import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../controllers/user-interactions.controller.js";
import { protect } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/follow", protect, followUser);
router.post("/unfollow", protect, unfollowUser);
router.get("/:userId/followers", protect, getFollowers);
router.get("/:userId/following", protect, getFollowing);

export default router;
