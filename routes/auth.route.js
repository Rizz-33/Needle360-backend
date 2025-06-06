import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import ROLES from "../constants.js";
import {
  checkAuth,
  checkIsApproved,
  deleteAccount,
  forgotPassword,
  login,
  logout,
  resendVerificationEmail,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { sendVerificationEmail } from "../mailtrap/emails.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

const router = express.Router();

// Google OAuth routes with role query parameter
router.get(
  "/google",
  (req, res, next) => {
    const role = parseInt(req.query.role) || ROLES.USER;
    if (role !== ROLES.USER) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_role`);
    }
    req.session = req.session || {};
    req.session.userRole = role;
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user;

      if (req.session && req.session.userRole) {
        const db = mongoose.connection.db;
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: { role: req.session.userRole },
          }
        );

        user.role = req.session.userRole;
        delete req.session.userRole;
      }

      const token = generateTokenAndSetCookie(res, user._id);

      if (!user.isVerified) {
        const verificationToken = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        const verificationTokenExpires = Date.now() + 3600000;

        const db = mongoose.connection.db;
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              verificationToken,
              verificationTokenExpires,
            },
          }
        );

        await sendVerificationEmail(user.email, verificationToken);
      }

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

      let redirectUrl;
      if (user.isVerified) {
        redirectUrl = `${
          process.env.CLIENT_URL
        }/?token=${token}&user=${encodeURIComponent(
          JSON.stringify(userResponse)
        )}`;
      } else {
        redirectUrl = `${
          process.env.CLIENT_URL
        }/verify-email?token=${token}&user=${encodeURIComponent(
          JSON.stringify(userResponse)
        )}`;
      }

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
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.delete("/delete-account", verifyToken, deleteAccount);

export default router;
