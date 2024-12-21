import bcryptjs from "bcryptjs";
import ROLES from "../constants.js";
import Admin from "../models/Schemas/admin.schema.js";
import TailorShopOwner from "../models/Schemas/tailor-shop-owners.schema.js";
import User from "../models/Schemas/users.schema.js";
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

  if (
    role === ROLES.TAILOR_SHOP_OWNER &&
    (!contactNumber || !shopName || !shopAddress || !shopRegistrationNumber)
  ) {
    return res
      .status(400)
      .send({ message: "Missing fields for tailor shop owner." });
  }

  if (
    role === ROLES.USER &&
    (!contactNumber ||
      !address ||
      !bankAccountNumber ||
      !bankName ||
      !bankBranch)
  ) {
    return res.status(400).send({ message: "Missing fields for user." });
  }

  try {
    let existingUser;

    // Check if the user already exists in the database
    switch (role) {
      case ROLES.ADMIN:
        existingUser = await Admin.findOne({ email });
        break;
      case ROLES.TAILOR_SHOP_OWNER:
        existingUser = await TailorShopOwner.findOne({ email });
        break;
      case ROLES.USER:
        existingUser = await User.findOne({ email });
        break;
      default:
        return res.status(400).send({ message: "Invalid role" });
    }

    if (existingUser) {
      return res.status(400).send({ message: "User already exists." });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    let user;
    switch (role) {
      case ROLES.ADMIN:
        user = new Admin({
          email,
          password: hashedPassword,
          name,
          verificationToken,
          verificationTokenExpires: Date.now() + 3600000, // 1 hour
        });
        break;
      case ROLES.TAILOR_SHOP_OWNER:
        user = new TailorShopOwner({
          email,
          password: hashedPassword,
          name,
          contactNumber,
          shopName,
          shopAddress,
          shopRegistrationNumber,
          verificationToken,
          verificationTokenExpires: Date.now() + 3600000, // 1 hour
        });
        break;
      case ROLES.USER:
        user = new User({
          email,
          password: hashedPassword,
          name,
          contactNumber,
          address,
          bankAccountNumber,
          bankName,
          bankBranch,
          verificationToken,
          verificationTokenExpires: Date.now() + 3600000, // 1 hour
        });
        break;
      default:
        return res.status(400).send({ message: "Invalid role" });
    }

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(201).send({
      message: "User created successfully!",
      user: {
        ...user._doc,
        password: null,
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during signup", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    res.send("Login route");
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during login", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.send("Logout route");
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error during logout", error: error.message });
  }
};
