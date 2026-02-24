import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinaryUrl() {
  const publicId = "test_document"; // We need the actual public ID from the DB
  const url = cloudinary.url(publicId, {
    resource_type: "raw", // PDFs are often treated as raw or image depending on upload
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  });
  console.log("Signed URL:", url);
}

testCloudinaryUrl();
