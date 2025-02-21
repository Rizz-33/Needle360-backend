import cloudinary from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads", // Folder name in Cloudinary
    allowedFormats: ["jpg", "jpeg", "png"], // Allowed file types
  },
});

const upload = multer({ storage });

module.exports = upload;
