import dotenv from "dotenv";
import { MailtrapClient } from "mailtrap";

dotenv.config();

export const mailtrapClient = new MailtrapClient({
  endpoint: process.env.MAILTRAP_ENDPOINT || "https://send.api.mailtrap.io",
  token: process.env.MAILTRAP_TOKEN,
});

export const sender = {
  email: "hello@needle360.online",
  name: "needle360°",
};

export const webhookConfig = {
  url:
    process.env.MAILTRAP_WEBHOOK_URL ||
    "http://needle360.online:4000/api/mailtrap-webhook",
  events: ["delivery", "soft_bounce", "hard_bounce", "spam_complaint"],
};
