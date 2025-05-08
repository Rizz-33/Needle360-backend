import crypto from "crypto";

export const validateMailtrapWebhook = (req, res, next) => {
  const signature = req.headers["mailtrap-signature"];
  const payload = JSON.stringify(req.body);

  // If no secret is configured, skip validation (not recommended for production)
  if (!process.env.MAILTRAP_WEBHOOK_SECRET) {
    console.warn("Warning: Processing webhook without signature validation");
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: "Unauthorized - Missing signature" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.MAILTRAP_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  next();
};
