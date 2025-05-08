import dotenv from "dotenv";
import { MailtrapClient } from "mailtrap";

dotenv.config();

// For testing, you can use these defaults if env vars aren't set
const DEFAULT_ENDPOINT = "https://send.api.mailtrap.io";
const DEFAULT_WEBHOOK_URL = "http://localhost:4000/api/mailtrap-webhook";

export const mailtrapClient = new MailtrapClient({
  endpoint: process.env.MAILTRAP_ENDPOINT || DEFAULT_ENDPOINT,
  token: process.env.MAILTRAP_TOKEN || "", // This must be set for emails to work
});

export const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL || "hello@needle360.online",
  name: process.env.MAILTRAP_SENDER_NAME || "needle360°",
};

// In your mailtrap.config.js or equivalent
console.log("Mailtrap Config:", {
  endpoint: process.env.MAILTRAP_ENDPOINT,
  token: process.env.MAILTRAP_TOKEN ? "*****" : "MISSING", // Mask token
  sender: sender,
});

export const webhookConfig = {
  url: process.env.MAILTRAP_WEBHOOK_URL || DEFAULT_WEBHOOK_URL,
  events: ["delivery", "soft_bounce", "hard_bounce", "spam_complaint"],
};
