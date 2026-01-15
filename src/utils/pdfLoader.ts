import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { Document } from "langchain";

// Embedding model
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});

// PDF path
const filePath = path.join(__dirname, "../assets/AGRICULTURE.pdf");

// Cached vector store
let vectorStore: MemoryVectorStore | null = null;

/**
 * Load PDF, embed documents, and return vector store
 */
export async function loadPdf(): Promise<MemoryVectorStore> {
  console.log("loading pdf");
  if (vectorStore) {
    return vectorStore;
  }

  try {
    const loader = new PDFLoader(filePath);
    let docs: Document[] = await loader.load();

    console.log("PDF loaded, total pages:", docs.length);

    // Optional slicing
    docs = docs.slice(4, 10);

    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

    console.log("Vector store created");
    return vectorStore;
  } catch (error) {
    console.error("Error loading PDF:", error);
    throw new Error("Failed to load and embed PDF");
  }
}
