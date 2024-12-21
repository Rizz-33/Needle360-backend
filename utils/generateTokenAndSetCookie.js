import JWT from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = JWT.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true, // xss protection
    secure: process.env.NODE_ENV === "production", // https
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: "strict", // csrf protection
  });

  return token;
};
