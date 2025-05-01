import dotenv from "dotenv";
import JWT from "jsonwebtoken";

// Initialize environment variables
dotenv.config();

/**
 * Authentication middleware for protecting routes
 * Verifies JWT token from authorization header, query params, or cookies
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from multiple possible sources
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Attach user ID to request object
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Authentication error:", error.message);
    return res.status(401).json({ message: "Invalid token." });
  }
};

/**
 * Helper function to extract token from various sources
 */
const extractToken = (req) => {
  // Check authorization header
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader); // Debug log
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Check x-access-token header
  console.log("X-Access-Token:", req.headers["x-access-token"]); // Debug log
  if (req.headers["x-access-token"]) {
    return req.headers["x-access-token"];
  }

  // Check cookies
  console.log("Cookies:", req.cookies); // Debug log
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // No token found
  console.log("No token found"); // Debug log
  return null;
};

// Alias for backward compatibility
export const protect = authenticate;
export const verifyToken = authenticate;
export const authMiddleware = authenticate;
