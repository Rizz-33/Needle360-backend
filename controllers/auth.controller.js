import bcryptjs from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import ROLES from "../constants.js";
import {
  sendPasswordResetEmail,
  sendResetPasswordConfirmationEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
  const {
    email,
    password,
    name,
    role,
    contactNumber,
    address,
    bankAccountNumber,
    bankName,
    bankBranch,
    shopName,
    shopAddress,
    shopRegistrationNumber,
  } = req.body;

  // Check for missing fields
  if (!email || !password || !name || !role) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  // Validate role-specific fields
  const validateFields = (role) => {
    const missingFields = [];
    switch (role) {
      case ROLES.TAILOR_SHOP_OWNER:
        [
          "contactNumber",
          "shopName",
          "shopAddress",
          "shopRegistrationNumber",
        ].forEach((field) => {
          if (!req.body[field]) missingFields.push(field);
        });
        break;
      case ROLES.USER:
        [
          "contactNumber",
          "address",
          "bankAccountNumber",
          "bankName",
          "bankBranch",
        ].forEach((field) => {
          if (!req.body[field]) missingFields.push(field);
        });
        break;
      case ROLES.ADMIN:
        break;
      default:
        return "Invalid role";
    }
    return missingFields;
  };

  const missingFields = validateFields(role);
  if (missingFields.length > 0) {
    return res.status(400).send({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    const db = mongoose.connection.db;

    // Check if the user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists." });
    }

    // Hash password and prepare user data
    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour

    // Prepare the user object based on role
    const user = {
      email,
      password: hashedPassword,
      name,
      role,
      verificationToken,
      verificationTokenExpires,
      ...(role === ROLES.TAILOR_SHOP_OWNER && {
        contactNumber,
        shopName,
        shopAddress,
        shopRegistrationNumber,
      }),
      ...(role === ROLES.USER && {
        contactNumber,
        address,
        bankAccountNumber,
        bankName,
        bankBranch,
      }),
    };

    // Insert the user into the collection
    const result = await db.collection("users").insertOne(user);

    // Generate token and set cookie
    generateTokenAndSetCookie(res, result.insertedId);

    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).send({
      message: "User created successfully!",
      user: {
        ...user,
        password: null, // Exclude password in the response
        _id: result.insertedId,
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during signup", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({
      verificationToken: code,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid or expired verification code." });
    }

    // Update user details
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    // Save changes
    await db.collection("users").updateOne({ _id: user._id }, { $set: user });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      message: "Email verified successfully!",
      user: {
        ...user,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(500).send({ message: "Internal server error." });
    console.error(error);
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
        bankBranch: user.bankBranch,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopRegistrationNumber: user.shopRegistrationNumber,
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
  const { email } = req.body;
  const db = mongoose.connection.db;

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) {
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
