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

// Function to generate a unique registration number based on user role
export const generateRegistrationNumber = async (db, role) => {
  let prefix = "A"; // Default prefix for admin
  if (role === ROLES.TAILOR_SHOP_OWNER) prefix = "T";
  else if (role === ROLES.USER) prefix = "C"; // Customer

  const highestRegUser = await db
    .collection("users")
    .find({ registrationNumber: new RegExp(`^${prefix}`) })
    .sort({ registrationNumber: -1 })
    .limit(1)
    .toArray();

  let nextNumber = 10000;

  if (highestRegUser.length > 0) {
    const lastRegNumber = highestRegUser[0].registrationNumber;
    const lastSequence = parseInt(lastRegNumber.substring(1));
    nextNumber = lastSequence + 1;
  }

  return `${prefix}${nextNumber}`;
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
        source: "resendVerificationEmail",
      });
    }

    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
        source: "resendVerificationEmail",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This email address is already verified.",
        source: "resendVerificationEmail",
      });
    }

    // Generate new verification token
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          verificationToken,
          verificationTokenExpires,
        },
      }
    );

    try {
      await sendVerificationEmail(email, verificationToken);
      return res.status(200).json({
        success: true,
        message: "Verification email resent successfully!",
        source: "resendVerificationEmail",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification email. Please try again later.",
        source: "resendVerificationEmail",
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      source: "resendVerificationEmail",
    });
  }
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
    } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
        source: "signup",
      });
    }

    const validateFields = (role) => {
      const missingFields = [];
      if (![ROLES.TAILOR_SHOP_OWNER, ROLES.USER, ROLES.ADMIN].includes(role)) {
        return ["Invalid role"];
      }

      switch (role) {
        case ROLES.TAILOR_SHOP_OWNER:
          ["contactNumber", "shopName", "shopAddress", "logoUrl"].forEach(
            (field) => {
              if (!req.body[field]) missingFields.push(field);
            }
          );
          break;
        case ROLES.USER:
          ["contactNumber", "address"].forEach((field) => {
            if (!req.body[field]) missingFields.push(field);
          });
          break;
        case ROLES.ADMIN:
          break;
      }
      return missingFields;
    };

    const missingFields = validateFields(role);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please provide the following: ${missingFields.join(", ")}.`,
        source: "signup",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
        source: "signup",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Your password must be at least 8 characters long.",
        source: "signup",
      });
    }

    const db = mongoose.connection.db;
    const existingUser = await db
      .collection("users")
      .findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered.",
        source: "signup",
      });
    }

    const registrationNumber = await generateRegistrationNumber(db, role);
    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpires = Date.now() + 3600000;

    const isApproved = role === ROLES.USER ? true : false;

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
      }),
      ...(role === ROLES.USER && {
        contactNumber,
        address,
      }),
    };

    const result = await db.collection("users").insertOne(user);
    if (!result.acknowledged || !result.insertedId) {
      throw new Error("Failed to create account in database");
    }

    try {
      await sendVerificationEmail(email, verificationToken);

      generateTokenAndSetCookie(res, result.insertedId);

      return res.status(201).json({
        success: true,
        message: "Account created successfully! Please verify your email.",
        user: {
          _id: result.insertedId,
          email,
          name,
          role,
          isApproved,
          registrationNumber,
          contactNumber: user.contactNumber,
          address: user.address,
          shopName: user.shopName,
          shopAddress: user.shopAddress,
          shopRegistrationNumber: user.shopRegistrationNumber,
          logoUrl: user.logoUrl,
        },
        source: "signup",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);

      // Don't delete the user if email fails - allow them to request a new verification email later
      return res.status(201).json({
        success: true,
        message:
          "Account created but we couldn't send the verification email. Please request a new verification email later.",
        user: {
          _id: result.insertedId,
          email,
          name,
          role,
          isApproved,
          registrationNumber,
          contactNumber: user.contactNumber,
          address: user.address,
          shopName: user.shopName,
          shopAddress: user.shopAddress,
          shopRegistrationNumber: user.shopRegistrationNumber,
          logoUrl: user.logoUrl,
        },
        source: "signup",
        warning: "Verification email not sent",
      });
    }
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong during signup. Please try again later.",
      source: "signup",
      error: error.message.includes("verification email")
        ? "We couldn't send the verification email. Please try again later."
        : error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Please enter the verification code.",
        source: "verifyEmail",
      });
    }

    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({
      verificationToken: code.toString(),
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "The verification code is invalid or has expired.",
        source: "verifyEmail",
      });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationToken: "", verificationTokenExpires: "" },
      }
    );

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.warn("Failed to send welcome email:", emailError.message);
    }

    // Construct user response without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: true,
      registrationNumber: user.registrationNumber,
      contactNumber: user.contactNumber,
      address: user.address,
      shopName: user.shopName,
      shopAddress: user.shopAddress,
      shopRegistrationNumber: user.shopRegistrationNumber,
      logoUrl: user.logoUrl,
    };

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome aboard!",
      user: userResponse,
      source: "verifyEmail",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while verifying your email. Please try again later.",
      source: "verifyEmail",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email and password.",
      source: "login",
    });
  }

  try {
    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Login Failed. Please try again!",
        source: "login",
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Login Failed. Please try again!",
        source: "login",
      });
    }

    const token = generateTokenAndSetCookie(res, user._id);

    // Construct user response without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      contactNumber: user.contactNumber,
      address: user.address,
      shopName: user.shopName,
      shopAddress: user.shopAddress,
      shopRegistrationNumber: user.shopRegistrationNumber,
      registrationNumber: user.registrationNumber,
      logoUrl: user.logoUrl,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      token,
      user: userResponse,
      source: "login",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong during login. Please try again later.",
      source: "login",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "You have been logged out successfully!",
      source: "logout",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong during logout. Please try again later.",
      source: "logout",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  const email = req.body.email.email;
  const db = mongoose.connection.db;

  try {
    const user = await db
      .collection("users")
      .findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "We couldn’t find an account with that email.",
        source: "forgotPassword",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpires = Date.now() + 3600000;

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
        },
      }
    );

    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );
    res.status(200).json({
      success: true,
      message: "A password reset link has been sent to your email.",
      source: "forgotPassword",
    });
  } catch (error) {
    console.error("Password reset error:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while sending the password reset email. Please try again later.",
      source: "forgotPassword",
    });
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
      return res.status(400).json({
        success: false,
        message: "The password reset link is invalid or has expired.",
        source: "resetPassword",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" },
      }
    );

    sendResetPasswordConfirmationEmail(user.email);

    res.status(200).json({
      success: true,
      message: "Your password has been reset successfully!",
      source: "resetPassword",
    });
  } catch (error) {
    console.error("Password reset error:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password. Please try again later.",
      source: "resetPassword",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
        source: "checkAuth",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "There was an issue with your account. Please log in again.",
        source: "checkAuth",
      });
    }

    const db = mongoose.connection.db;
    const user = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(req.userId) },
        { projection: { email: 1, role: 1, isVerified: 1, isApproved: 1 } }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Your account could not be found. Please log in again.",
        source: "checkAuth",
      });
    }

    const token = generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
      },
      token,
      source: "checkAuth",
    });
  } catch (error) {
    console.error("Authentication check error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong on our end. Please try again later.",
      source: "checkAuth",
      error: error.message,
    });
  }
};

export const checkIsApproved = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "There was an issue with your account ID.",
      source: "checkIsApproved",
    });
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
      return res.status(404).json({
        success: false,
        message: "Your account could not be found.",
        source: "checkIsApproved",
      });
    }

    res.status(200).json({
      success: true,
      isApproved: user.isApproved || false,
      source: "checkIsApproved",
    });
  } catch (error) {
    console.error("Approval check error:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while checking your approval status. Please try again later.",
      source: "checkIsApproved",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "There was an issue with your account ID.",
        source: "deleteAccount",
      });
    }

    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Your account could not be found.",
        source: "deleteAccount",
      });
    }

    const result = await db.collection("users").deleteOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "We couldn’t delete your account. Please try again.",
        source: "deleteAccount",
      });
    }

    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully.",
      source: "deleteAccount",
    });
  } catch (error) {
    console.error("Account deletion error:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting your account. Please try again later.",
      source: "deleteAccount",
      error: error.message,
    });
  }
};
