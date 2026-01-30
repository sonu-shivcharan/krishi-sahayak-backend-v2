import { createAgent, createMiddleware, tool } from "langchain";
import { llm } from "../config/llm";
import { docsRetriever } from "../tools/retrieveDocs";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import z from "zod";
import { getUserProfileFromDB } from "../tools/getUserProfileFromDB";
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
const contextSchema = z.object({
  userId: z.string().optional(),
});
type Context = z.infer<typeof contextSchema>;

const toolMonitoringMiddlerware = createMiddleware({
  name: "toolMonitoringMiddlerware",
  contextSchema,
  wrapToolCall: async (request, handler) => {
    console.log("request.tool", request.tool.name, request.toolCall);
    return handler({ ...request });
  },
});

const getWeather = tool(
  ({ location }) => {
    // Dummy implementation - replace with actual weather fetching logic
    return `The current weather in ${location} is sunny with a temperature of 25°C.`;
  },
  {
    name: "getWeather",
    description: "Get the current weather information for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get the weather for."),
    }),
  },
);
export const krishiAgent = createAgent({
  model: llm,
  name: "KrishiSahayak",
  systemPrompt,
  checkpointer,
  contextSchema,
  tools: [docsRetriever, getUserProfileFromDB, getWeather],
  middleware: [toolMonitoringMiddlerware],
});
