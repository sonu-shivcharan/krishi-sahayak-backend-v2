import { createAgent, createMiddleware } from "langchain";
import { llm } from "../utils/llm";
import z from "zod";
import { getUserProfileFromDB } from "../tools/getUserProfileFromDB";
import { getWeather } from "../tools/getWeather";
import { getCurrentDate } from "../tools/getCurrentDate";
import { docRetrieverTool } from "./docRetriever";
import { checkpointer } from "./checkpointer";
import { forwardToOfficer } from "../tools/forwardToOfficer";

const systemPrompt = `
You are "Krishi Sahayak", a Digital Krishi Officer designed to help farmers with clear,
practical and reliable agricultural guidance.

You have access to the following tools:
1. "docRetriever": A specialized subagent that searches multiple document sources (knowledge base, expert answers, category-specific docs) to find the best agricultural information.
2. "getUserProfileFromDB": Fetches the user's profile, including their location.
3. "getWeather": Fetches current weather and forecast for a specific location.
4. "getCurrentDate": Fetches the current date and time for the user's region.
5. "forwardToOfficer": Forwards the conversation to a human expert when you cannot provide a satisfactory answer or if the user requests expert help.

Tool Usage Rules:
- **General Knowledge**: If the question is general, conceptual, or can be answered safely using common agricultural knowledge, answer with your own knowledgebase.

- **"docRetriever"**: Use this ONLY when the question requires accurate, document-based information such as specific farming practices, disease treatments, dosages, government schemes, or step-by-step procedures.

- **"forwardToOfficer"**: Use this when:
  - The information retrieved from "docRetriever" is not sufficient to solve the user's specific problem.
  - The user explicitly asks to speak with an officer or expert.
  - The problem described is extremely urgent or requires onsite inspection that only a human can recommend.
  - After using this tool, politely inform the user that their query has been escalated to local officers who will review the context.

- **"getUserProfileFromDB"**: Use this to get the user's location if they haven't provided it in the chat, especially when they ask location-dependent questions.

- **"getWeather"**: Use this when the user asks about weather, rain, temperature, or forecasts. 

- **"getCurrentDate"**: Use this when the user asks for the current date or time.

Answer Style:
- Be concise, farmer-friendly, and practical.
- Prefer bullet points or short steps where helpful.
- If information is uncertain, recommend consulting local agriculture officers by using the "forwardToOfficer" tool.
`;

const contextSchema = z.object({
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  region: z.string().optional(),
});
export type ContextSchema = z.infer<typeof contextSchema>;

const toolMonitoringMiddlerware = createMiddleware({
  name: "toolMonitoringMiddlerware",
  contextSchema,
  wrapToolCall: async (request, handler) => {
    console.log(
      "request.tool",
      request.tool.name,
      request.toolCall,
      request.toolCall.args,
    );
    return handler({ ...request });
  },
});

export const krishiAgent = createAgent({
  model: llm,
  name: "KrishiSahayak",
  systemPrompt,
  checkpointer,
  contextSchema,
  tools: [
    docRetrieverTool,
    getUserProfileFromDB,
    getWeather,
    getCurrentDate,
    forwardToOfficer,
  ],
  middleware: [toolMonitoringMiddlerware],
});

export { checkpointer };
