import express from "express";
import {
  createGroupConversation,
  createOrGetConversation,
  getConversationById,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Add request logging middleware for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, {
    body: req.body,
    params: req.params,
    user: req.user?._id || req.userId,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Routes with explicit error handling
router.post("/", async (req, res, next) => {
  try {
    await createOrGetConversation(req, res);
  } catch (error) {
    console.error("Route error in POST /:", error);
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    await getUserConversations(req, res);
  } catch (error) {
    console.error("Route error in GET /:", error);
    next(error);
  }
});

router.get("/:conversationId", async (req, res, next) => {
  try {
    await getConversationById(req, res);
  } catch (error) {
    console.error("Route error in GET /:conversationId:", error);
    next(error);
  }
});

router.post("/group", async (req, res, next) => {
  try {
    await createGroupConversation(req, res);
  } catch (error) {
    console.error("Route error in POST /group:", error);
    next(error);
  }
});

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error("Conversation router error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "Internal server error in conversation routes",
    error: error.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    }),
  });
});

export default router;
