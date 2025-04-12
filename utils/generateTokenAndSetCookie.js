// Backend: modified generateTokenAndSetCookie.js
import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Extended for convenience while testing
  });

  // Set HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Return token to include in response body
  return token;
};
