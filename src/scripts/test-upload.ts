import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  const filePath = path.join(__dirname, "dummy.pdf");
  fs.writeFileSync(filePath, "dummy pdf content");

  const result = await cloudinary.uploader.upload(filePath, {
    folder: "government_schemes",
    resource_type: "raw", // Let's try raw and auto to see differences
  });

  console.log("RAW upload result:", result);

  const resultAuto = await cloudinary.uploader.upload(filePath, {
    folder: "government_schemes",
    resource_type: "auto", 
  });

  console.log("AUTO upload result:", resultAuto);
}

run();
