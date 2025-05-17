import express from "express";
import {
  checkAuth,
  checkIsApproved,
  deleteAccount,
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import passport from "../utils/passport.config.js";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      const user = req.user;
      const token = generateTokenAndSetCookie(res, user._id);

      // Construct user response
      const userResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        registrationNumber: user.registrationNumber,
        contactNumber: user.contactNumber,
        address: user.address,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopRegistrationNumber: user.shopRegistrationNumber,
        logoUrl: user.logoUrl,
      };

      // Redirect to frontend with token and user data
      const redirectUrl = user.isVerified
        ? `${
            process.env.CLIENT_URL
          }/design?token=${token}&user=${encodeURIComponent(
            JSON.stringify(userResponse)
          )}`
        : `${
            process.env.CLIENT_URL
          }/verify-email?token=${token}&email=${encodeURIComponent(
            user.email
          )}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

router.get("/check-auth", verifyToken, checkAuth);
router.get("/check-approval/:userId", checkIsApproved);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.delete("/delete-account", verifyToken, deleteAccount);

export default router;
