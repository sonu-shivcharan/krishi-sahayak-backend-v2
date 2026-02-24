import "dotenv/config";
import mongoose from "mongoose";
import ingestionService from "../services/ingestion.service";
import fileService from "../services/file.service";
import { FileType } from "../types/enums";
import { initQdrant } from "../utils/qdrantStore";
import connectDB from "../db/connectDB";

/**
 * This script tests the ingestion pipeline by mocking a file upload.
 * It manually triggers the upload process which emits the event that ingestionService listens to.
 */
async function testIngestion() {
  try {
    console.log("Starting ingestion test...");

    // 1. Connect to DB and initialize Qdrant
    await connectDB();
    await initQdrant();

    // 2. Mock a file upload
    // Replace with a real public PDF URL for testing if needed
    const testFile = {
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      path: "test/dummy_pdf",
      type: FileType.PDF,
      uploadedBy: new mongoose.Types.ObjectId(),
    };

    console.log("Mocking file upload to trigger ingestion...");
    const uploadedFile = await fileService.uploadFile(testFile);

    console.log(`File created with ID: ${uploadedFile._id}. Ingestion event emitted.`);
    console.log("Waiting for ingestion to complete (check console logs)...");

    // Keep the script alive for a few seconds to let ingestion finish
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("Test finished.");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testIngestion();
