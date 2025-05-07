import crypto from "crypto";

export const validateMailtrapWebhook = (req, res, next) => {
  const signature = req.headers["mailtrap-signature"];
  const payload = JSON.stringify(req.body);

  if (!signature) {
    return res.status(401).json({ error: "Unauthorized" });
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
