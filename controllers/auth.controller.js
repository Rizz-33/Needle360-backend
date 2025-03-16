import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { console } from "inspector";
import mongoose from "mongoose";
import ROLES from "../constants.js";
import {
  sendPasswordResetEmail,
  sendResetPasswordConfirmationEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

// Function to generate a unique registration number based on user role
const generateRegistrationNumber = async (db, role) => {
  let prefix = "A"; // Default prefix for admin
  if (role === ROLES.TAILOR_SHOP_OWNER) prefix = "T";
  else if (role === ROLES.USER) prefix = "C"; // Customer

  // Find the highest existing registration number with this prefix
  const highestRegUser = await db
    .collection("users")
    .find({ registrationNumber: new RegExp(`^${prefix}`) })
    .sort({ registrationNumber: -1 })
    .limit(1)
    .toArray();

  let nextNumber = 10000; // Start with 10000 (will become 5-digit number)

  if (highestRegUser.length > 0) {
    const lastRegNumber = highestRegUser[0].registrationNumber;
    const lastSequence = parseInt(lastRegNumber.substring(1)); // Skip the prefix
    nextNumber = lastSequence + 1;
  }

  return `${prefix}${nextNumber}`;
};

export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      contactNumber,
      address,
      shopName,
      shopAddress,
      logoUrl,
      bankAccountNumber,
      bankName,
    } = req.body;

    // Check for missing required fields
    if (!email || !password || !name || !role) {
      return res.status(400).send({ message: "Missing required fields." });
    }

    // Validate role-specific fields
    const validateFields = (role) => {
      const missingFields = [];

      // Check if role is valid
      if (![ROLES.TAILOR_SHOP_OWNER, ROLES.USER, ROLES.ADMIN].includes(role)) {
        return ["Invalid role"];
      }

      switch (role) {
        case ROLES.TAILOR_SHOP_OWNER:
          [
            "contactNumber",
            "shopName",
            "shopAddress",
            "logoUrl",
            "bankAccountNumber",
            "bankName",
          ].forEach((field) => {
            if (!req.body[field]) missingFields.push(field);
          });
          break;
        case ROLES.USER:
          ["contactNumber", "address", "bankAccountNumber", "bankName"].forEach(
            (field) => {
              if (!req.body[field]) missingFields.push(field);
            }
          );
          break;
        case ROLES.ADMIN:
          break;
      }
      return missingFields;
    };

    const missingFields = validateFields(role);
    if (missingFields.length > 0) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: "Invalid email format." });
    }

    // Password validation
    if (password.length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters long." });
    }

    console.log("All fields are present and validated.");

    const db = mongoose.connection.db;

    // Check if the user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists." });
    }

    // Generate a unique registration number
    const registrationNumber = await generateRegistrationNumber(db, role);

    // Hash password and prepare user data
    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour

    // Determine isApproved based on role
    const isApproved = role === ROLES.USER ? true : false;

    // Prepare the user object based on role
    const user = {
      email,
      password: hashedPassword,
      name,
      role,
      isApproved,
      registrationNumber,
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date(),
      ...(role === ROLES.TAILOR_SHOP_OWNER && {
        contactNumber,
        shopName,
        shopAddress,
        shopRegistrationNumber: registrationNumber,
        logoUrl,
        bankAccountNumber,
        bankName,
      }),
      ...(role === ROLES.USER && {
        contactNumber,
        address,
        bankAccountNumber,
        bankName,
      }),
    };

    // Insert the user into the collection
    const result = await db.collection("users").insertOne(user);
    if (!result.acknowledged || !result.insertedId) {
      throw new Error("Failed to insert user into database");
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      if (emailError.message.includes("has reached its limit")) {
        console.warn(
          "Email limit reached, continuing with signup without email verification"
        );
      } else {
        await db.collection("users").deleteOne({ _id: result.insertedId });
        throw new Error(
          `Failed to send verification email: ${emailError.message}`
        );
      }
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(res, result.insertedId);

    res.status(201).send({
      message: "User created successfully!",
      user: {
        ...user,
        password: null,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .send({ message: "Error during signup", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res
        .status(400)
        .send({ message: "Verification code is required." });
    }

    console.log("Attempting to verify with code:", code);

    const db = mongoose.connection.db;

    // Log the user we're trying to find for debugging
    const userCount = await db.collection("users").countDocuments({
      verificationToken: code.toString(),
    });

    console.log(`Found ${userCount} users with this verification token`);

    // Check if token is expired
    const expiredCount = await db.collection("users").countDocuments({
      verificationToken: code.toString(),
      verificationTokenExpires: { $lte: Date.now() },
    });

    if (expiredCount > 0) {
      console.log("Found user but token has expired");
    }

    // Find the user with the verification token
    const user = await db.collection("users").findOne({
      verificationToken: code.toString(),
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("No valid user found with the provided code");
      return res
        .status(400)
        .send({ message: "Invalid or expired verification code." });
    }

    console.log("Found valid user to verify:", user.email);

    // Update user details
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationToken: "", verificationTokenExpires: "" },
      }
    );

    console.log("User successfully verified");

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.warn("Failed to send welcome email:", emailError.message);
    }

    res.status(200).json({
      message: "Email verified successfully!",
      user: {
        ...user,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Missing email or password." });
  }

  try {
    const db = mongoose.connection.db;

    // Check if the user exists
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid email or password." });
    }

    // Check if the password is correct
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send({ message: "Invalid email or password." });
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).send({
      message: "Successfully logged in!",
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address,
        bankAccountNumber: user.bankAccountNumber,
        bankName: user.bankName,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopRegistrationNumber: user.shopRegistrationNumber,
        registrationNumber: user.registrationNumber,
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during login", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("token");
    res.status(200).json({ message: "Successfully logged out!" });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during logout", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const email = req.body.email.email;
  const db = mongoose.connection.db;

  console.log("Received email:", email);

  try {
    // Case-insensitive query
    const user = await db
      .collection("users")
      .findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

    if (!user) {
      console.log("User not found with email:", email);
      return res.status(400).json({ message: "User not found." });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;

    await db.collection("users").updateOne({ _id: user._id }, { $set: user });

    // Send password reset email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );
    console.log("Password reset email sent successfully.");
    res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Error during password reset:", error.message);
    res.status(500).json({ message: "Error during password reset." });
  }
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const db = mongoose.connection.db;

  try {
    const user = await db.collection("users").findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Update user details
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save changes
    await db.collection("users").updateOne({ _id: user._id }, { $set: user });

    sendResetPasswordConfirmationEmail(user.email);

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error during password reset:", error.message);
    res.status(500).json({ message: "Error during password reset." });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const user = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(req.userId) },
        { projection: { password: 0 } }
      );

    if (!user) {
      return res.status(401).send({ message: "User not found." });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.log("Error checking authentication:", error.message);
    res.status(500).send({ message: "Error checking authentication." });
  }
};

export const checkIsApproved = async (req, res) => {
  const { userId } = req.params;

  // Validate userId format if using MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const db = mongoose.connection.db;
    const user = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { isApproved: 1 } }
      );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ isApproved: user.isApproved || false });
  } catch (error) {
    console.error("Error fetching isApproved value:", error.message);
    res.status(500).json({ message: "Error fetching isApproved value." });
  }
};
