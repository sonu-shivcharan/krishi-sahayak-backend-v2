import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType: "image" | "video" | "raw" | "auto" = "auto";
    if (file.mimetype === "application/pdf") {
      resourceType = "raw"; // Force raw for PDFs so they get a public, unrestricted URL
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    }

    return {
      folder: "government_schemes",
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

export default cloudinary;
