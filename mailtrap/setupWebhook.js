import { mailtrapClient, webhookConfig } from "./mailtrap.js";

export async function setupMailtrapWebhook() {
  try {
    const response = await mailtrapClient.webhooks.createWebhook({
      url: webhookConfig.url,
      events: webhookConfig.events,
      active: true,
    });

    console.log("Webhook setup successfully:", response);
    return response;
  } catch (error) {
    console.error("Error setting up webhook:", error);
    throw error;
  }
}
