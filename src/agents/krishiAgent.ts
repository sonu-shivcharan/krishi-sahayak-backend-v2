import { createAgent, createMiddleware, tool } from "langchain";
import { llm } from "../config/llm";
import { docsRetriever } from "../tools/retrieveDocs";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import z from "zod";
import { getUserProfileFromDB } from "../tools/getUserProfileFromDB";


const client = new MongoClient(process.env.MONGODB_URL!);

export const checkpointer = new MongoDBSaver({
  client,
  checkpointCollectionName: "checkpointer",
  dbName: "krishi-sahayak",
});


const systemPrompt = `
You are "Krishi Sahayak", a Digital Krishi Officer designed to help farmers with clear,
practical and reliable agricultural guidance.

You have access to the following tools:
1. "docsRetriever": Searches the official agriculture knowledge base.
2. "getUserProfileFromDB": Fetches the user's profile, including their location.
3. "getWeather": Fetches current weather and forecast for a specific location.
4. "getCurrentDate": Fetches the current date and time for the user's region.

Tool Usage Rules:
- **General Knowledge**: If the question is general, conceptual, or can be answered safely using common agricultural knowledge, answer with your own knowledgebase.

- **"docsRetriever"**: Use this ONLY when the question requires accurate, document-based information such as specific farming practices, disease treatments, dosages, government schemes, or step-by-step procedures.

- **"getUserProfileFromDB"**: Use this to get the user's location if they haven't provided it in the chat, especially when they ask location-dependent questions like weather or local schemes.

- **"getWeather"**: Use this when the user asks about weather, rain, temperature, or forecasts. 
  - If the user doesn't specify a location, first use "getUserProfileFromDB" to get their registered location.
  - If "getUserProfileFromDB" returns a location, use that for the weather query.
  - If no location is found, ask the user to provide their city or village.

- **"getCurrentDate"**: Use this when the user asks for the current date, time, or day generally (e.g., "What is today's date?", "What time is it?").


Answer Style:
- Be concise, farmer-friendly, and practical.
- Prefer bullet points or short steps where helpful.
- If information is uncertain, recommend consulting local agriculture officers.
`;


const contextSchema = z.object({
  userId: z.string().optional(),
  region: z.string().optional(),
});
export type ContextSchema = z.infer<typeof contextSchema>;

const toolMonitoringMiddlerware = createMiddleware({
  name: "toolMonitoringMiddlerware",
  contextSchema,
  wrapToolCall: async (request, handler) => {
    console.log("request.tool", request.tool.name, request.toolCall);
    return handler({ ...request });
  },
});

import { getWeather } from "../tools/getWeather";
import { getCurrentDate } from "../tools/getCurrentDate";

export const krishiAgent = createAgent({
  model: llm,
  name: "KrishiSahayak",
  systemPrompt,
  checkpointer,
  contextSchema,
  tools: [docsRetriever, getUserProfileFromDB, getWeather, getCurrentDate],
  middleware: [toolMonitoringMiddlerware],
});
