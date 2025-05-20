import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import ROLES from "../constants.js";
import { generateRegistrationNumber } from "../controllers/auth.controller.js";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://needle360.online/api/auth/google/callback" ||
        "http://localhost:4000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = mongoose.connection.db;
        const existingUser = await db
          .collection("users")
          .findOne({ email: profile.emails[0].value });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Only allow role: 1 (USER) for Google OAuth
        const role = req.session?.userRole || ROLES.USER;
        if (role !== ROLES.USER) {
          return done(
            new Error("Google OAuth is only available for customers"),
            null
          );
        }

        // Create new user
        const registrationNumber = await generateRegistrationNumber(db, role);

        const newUser = {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          role: role,
          isVerified: false,
          isApproved: role === ROLES.USER,
          registrationNumber,
          createdAt: new Date(),
        };

        const result = await db.collection("users").insertOne(newUser);

        if (!result.acknowledged || !result.insertedId) {
          throw new Error("Failed to create user in database");
        }

        const createdUser = {
          ...newUser,
          _id: result.insertedId,
        };

        done(null, createdUser);
      } catch (error) {
        console.error("Google OAuth error:", error);
        done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
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

// Export the configured passport instance
export default passport;
