// routes/conversation.route.js
import express from "express";
import {
  createGroupConversation,
  createOrGetConversation,
  getConversationById,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; // Adjust the import path to your actual verify token middleware

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes
router.post("/", createOrGetConversation);
router.get("/", getUserConversations);
router.get("/:conversationId", getConversationById);
router.post("/group", createGroupConversation);

export default router;
