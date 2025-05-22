import express from "express";
import {
  createConversation,
  createGroupConversation,
  getConversationById,
  getConversations,
} from "../controllers/conversation.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes
router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:conversationId", getConversationById);
router.post("/group", createGroupConversation);

export default router;
