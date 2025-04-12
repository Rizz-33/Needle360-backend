// routes/message.route.js
import express from "express";
import {
  deleteMessage,
  getConversationMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; // Adjust the import path to your actual verify token middleware

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes
router.post("/send", sendMessage);
router.get("/conversation/:conversationId", getConversationMessages);
router.delete("/:messageId", deleteMessage);

export default router;
