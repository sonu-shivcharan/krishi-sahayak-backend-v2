import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

async function testUpload() {
  const form = new FormData();
  // Create a dummy pdf file
  const filePath = path.join(__dirname, "dummy.pdf");
  fs.writeFileSync(filePath, "dummy pdf content");

  form.append("file", fs.createReadStream(filePath));

  try {
    // We can't hit the real endpoint easily without a valid clerk token,
    // actually, let's just make a dummy script that uses multer-storage-cloudinary to see what properties are there.
  } catch (e) {
    console.error(e);
  }
}

testUpload();
