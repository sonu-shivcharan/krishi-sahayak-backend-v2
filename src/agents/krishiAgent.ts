import { createAgent } from "langchain";
import { llm } from "../config/llm";
import { docsRetriever } from "../tools/retrieveDocs";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URL!);
const checkpointer = new MongoDBSaver({
  client,
  checkpointCollectionName: "chechpointer",
  dbName: "krishi-sahayak",
});
const systemPrompt = `
You are "Krishi Sahayak", a Digital Krishi Officer designed to help farmers with clear,
practical and reliable agricultural guidance.

You have access to a tool called "docsRetriever" that searches the official agriculture
knowledge base (crop practices, diseases, treatments, schemes, and procedures).

Tool Usage Rules:
- Use "docsRetriever" ONLY when the question requires accurate, document-based information
  such as specific farming practices, disease treatments, dosages, government schemes,
  or step-by-step procedures.
- If the question is general, conceptual, or can be answered safely using common agricultural
  knowledge, answer with your own knowledgebase.

Answer Style:
- Be concise, farmer-friendly, and practical.
- Prefer bullet points or short steps where helpful.
- If information is uncertain, recommend consulting local agriculture officers.

`;

export const krishiAgent = createAgent({
  model: llm,
  name: "KrishiSahayak",
  systemPrompt,
  checkpointer,
  tools: [docsRetriever],
});
