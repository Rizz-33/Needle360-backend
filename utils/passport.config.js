import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import ROLES from "../constants.js";
import { generateRegistrationNumber } from "../controllers/auth.controller.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

// Dynamic callback URL based on environment
const callbackURL =
  process.env.NODE_ENV === "production"
    ? `${process.env.API_URL}/api/auth/google/callback`
    : "/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = mongoose.connection.db;
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Check if user already exists
        let user = await db.collection("users").findOne({ googleId });

        if (!user) {
          user = await db
            .collection("users")
            .findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

          if (user) {
            // Link Google account to existing user
            await db
              .collection("users")
              .updateOne({ _id: user._id }, { $set: { googleId } });
          } else {
            // Create new user
            const registrationNumber = await generateRegistrationNumber(
              db,
              ROLES.USER
            );
            const verificationToken = Math.floor(
              100000 + Math.random() * 900000
            ).toString();
            const verificationTokenExpires = Date.now() + 3600000;

            const newUser = {
              googleId,
              email,
              name: profile.displayName,
              role: ROLES.USER,
              isApproved: true,
              isVerified: false,
              registrationNumber,
              verificationToken,
              verificationTokenExpires,
              createdAt: new Date(),
              contactNumber: "",
              address: "",
            };

            const result = await db.collection("users").insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };

            try {
              await sendVerificationEmail(email, verificationToken);
            } catch (emailError) {
              console.error("Failed to send verification email:", emailError);
            }
          }
        }

        if (user.isVerified) {
          try {
            await sendWelcomeEmail(user.email, user.name);
          } catch (emailError) {
            console.warn("Failed to send welcome email:", emailError);
          }
        }

        done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = mongoose.connection.db;
    const user = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(id) });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
