import dotenv from "dotenv";
import JWT from "jsonwebtoken";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers["x-access-token"];

  if (!token) {
    return res
      .status(401)
      .send({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).send({ message: "Invalid token." });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Error verifying token:", error.message);
    return res.status(401).send({ message: "Invalid token." });
  }
};
