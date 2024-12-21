
import jwt from "jsonwebtoken";



export const generateTokenAndSetCookie = (res, userId) => {

  if (!process.env.JWT_SECRET) {

    throw new Error("JWT_SECRET is not defined");

  }



  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {

    expiresIn: "1h",

  });



  res.cookie("token", token, {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // csrf protection

  });

};
