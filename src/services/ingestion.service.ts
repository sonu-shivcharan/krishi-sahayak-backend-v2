import { randomUUID } from "node:crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { qdrantClient, QDRANT_COLLECTIONS } from "../utils/qdrantStore";
import eventEmitter, { EVENTS } from "../utils/events";
import { IFile } from "../types/file.types";

import fs from "fs";
import path from "path";
import os from "os";

export class IngestionService {
  constructor() {
    // Register event listener
    this.init();
  }

  private init() {
    eventEmitter.on(EVENTS.FILE_UPLOADED, async (file: IFile) => {
      console.log(
        `IngestionService: Received file:uploaded event for file ${file._id}`,
      );
      try {
        await this.ingestFile(file);
      } catch (error) {
        console.error(
          `IngestionService: Error ingesting file ${file._id}:`,
          error,
        );
      }
    });
  }

  /**
   * Ingest file content into Qdrant
   */
  async ingestFile(file: IFile) {
    if (file.type !== "pdf") {
      console.log(
        `IngestionService: Skipping file ${file._id} as it is not a PDF.`,
      );
      return;
    }

    console.log(`IngestionService: Starting ingestion for file: ${file.url}`);

    // 1. Download file content from Cloudinary securely
    const tempFilePath = path.join(os.tmpdir(), `${file._id}.pdf`);

    console.log(`IngestionService: Fetching file from public URL: ${file.url}`);

    const response = await fetch(file.url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from Cloudinary: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // 2. Load PDF
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();

      // 3. Split content
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitDocuments(docs);

      // 4. Ingest into Qdrant using Qdrant Cloud Inference
      const points = chunks.map((chunk: Document, index: number) => ({
        id: randomUUID(),
        vector: {
          text: chunk.pageContent,
          model: "sentence-transformers/all-minilm-l6-v2",
        },
        payload: {
          // ...chunk.metadata,
          fileId: file._id.toString(),
          uploadedBy: file.uploadedBy.toString(),
          source: file.url,
          chunkIndex: index,
          pageContent: chunk.pageContent,
        },
      }));

      await qdrantClient.upsert(QDRANT_COLLECTIONS.GOVERNMENT_SCHEMES, {
        points,
        wait: true,
      });

      console.log(
        `IngestionService: Successfully ingested file ${file._id} into Qdrant.`,
      );
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}

export default new IngestionService();
