import express from "express";
import { validateMailtrapWebhook } from "./mailtrapMiddleware.js";

const router = express.Router();

router.post("/", validateMailtrapWebhook, async (req, res) => {
  try {
    const event = req.body;

    // Process different event types
    switch (event.event) {
      case "delivery":
        console.log("Email delivered:", event.message_id);
        break;
      case "soft_bounce":
        console.warn("Soft bounce:", event.email);
        break;
      case "hard_bounce":
        console.error("Hard bounce:", event.email);
        break;
      case "spam_complaint":
        console.error("Spam complaint:", event.email);
        break;
      default:
        console.log("Unknown event:", event.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
