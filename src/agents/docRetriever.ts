import { createAgent, toolCallLimitMiddleware } from "langchain";
import { llm } from "../utils/llm";
import {
  expertAnswersSearch,
  specializedCategorySearch,
  governmentSchemesSearch,
} from "../tools/docRetrievalTools";
import { checkpointer } from "./checkpointer";

const systemPrompt = `
You are the "DocRetriever" subagent for Krishi Sahayak. Your sole purpose is to gather the most relevant and accurate information from our agricultural document stores.

You have access to three specialized tools:
1. "specializedCategorySearch": Use this for all agricultural knowledge base searches, farming advice, crop guidelines, disease/pest management, fertilizer usage, irrigation, seed treatments, and standard practices. When applicable, provide the "crop" (e.g., wheat, rice, tomato) and/or "queryType" (e.g., 'Disease Management', 'Insect Management', 'Fertilizer Use and Availability', 'Nutrient Deficiency/Excessiveness Management', 'Irrigation Management', 'Seed Sowing And Treatment', 'Sowing Time and Weather') parameters to get precise, filtered results. If filtering is not applicable or crop is unknown, a general query will still retrieve relevant documents.
2. "expertAnswersSearch": Use this to find how human experts (Agriculture Officers) have answered similar specific queries and solved past case studies.
3. "governmentSchemesSearch": Use this when the user asks about government schemes, subsidies, loans, or financial aid for farmers.

Instructions:
- Analyze the user's request and decide which tool(s) will provide the best information.
- Use "specializedCategorySearch" as the primary knowledge base search for crop, technical, and general agricultural queries.
- You can use multiple tools if needed to provide a comprehensive set of documents.
- Present the retrieved information clearly, noting the source (Knowledge Base vs. Expert Answer vs. Government Scheme).
- If no information is found, state that clearly and suggest what other details might help in the search.
- Do not make up information; only report what you retrieve.
`;
const tollCallRateLimiter = toolCallLimitMiddleware({
  runLimit: 5, // Max 5 tool calls per invocation
  threadLimit: 20, // Max 20 tool calls for the whole session
  exitBehavior: "end", // Stop execution when limit is reached
});

export const docRetriever = createAgent({
  model: llm,
  name: "DocRetriever",
  systemPrompt,
  checkpointer,
  tools: [
    specializedCategorySearch,
    expertAnswersSearch,
    governmentSchemesSearch,
  ],
  middleware: [tollCallRateLimiter],
});

/**
 * Expose the DocRetriever agent as a tool that can be used by the main KrishiAgent.
 */
import { tool } from "langchain";
import z from "zod";
import { HumanMessage } from "@langchain/core/messages";

export const docRetrieverTool = tool(
  async ({ query }, config) => {
    const result = await docRetriever.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      config,
    );

    // Return the last message from the subagent's response
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content;
  },
  {
    name: "docRetriever",
    description:
      "A specialized subagent that searches agricultural knowledge bases (specialized category search, expert answers, government schemes) to find the best agricultural information.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The specific question or topic to search for documents on in English language",
        ),
    }),
  },
);
