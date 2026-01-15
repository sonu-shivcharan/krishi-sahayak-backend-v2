import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain";
import path from "path";

const filePath = path.join(__dirname, "../assets/AGRICULTURE.pdf");

let docs: Document<Record<string, any>>[] | null = null;
export async function loadPdf() {
  console.log("loading pdf");
  if (docs) {
    return docs;
  }
  try {
    const loader = new PDFLoader(filePath);
    docs = await loader.load();
    console.log("pdf loading success", docs[3]);

    return docs;
  } catch (error) {
    console.log("error", error);
    throw new Error("Error loading pdf");
  }
}
