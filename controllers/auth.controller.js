import bcryptjs from "bcryptjs";
import Admin from "../models/Admin";
import TailorShopOwner from "../models/TailorShopOwner";
import User from "../models/User";

export const signup = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    let existingUser;

    switch (role) {
      case "admin":
        existingUser = await Admin.findOne({ email });
        break;
      case "tailor-shop-owner":
        existingUser = await TailorShopOwner.findOne({ email });
        break;
      case "user":
        existingUser = await User.findOne({ email });
        break;
      default:
        return res.status(400).send({ message: "Invalid role" });
    }

    if (existingUser) {
      return res.status(400).send({ message: "User already exists." });
    }

    let user;

    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    switch (role) {
      case "admin":
        user = new Admin({
          email,
          password: hashedPassword,
          name,
          verificationToken,
          verificationTokenExpires: Date.now() + 3600000, // 1 hour
        });
        break;
      case "tailor-shop-owner":
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
      case "user":
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
