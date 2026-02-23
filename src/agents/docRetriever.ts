import { createAgent } from "langchain";
import { llm } from "../utils/llm";
import { 
  knowledgeBaseSearch, 
  expertAnswersSearch, 
  specializedCategorySearch 
} from "../tools/docRetrievalTools";
import { checkpointer } from "./checkpointer";

const systemPrompt = `
You are the "DocRetriever" subagent for Krishi Sahayak. Your sole purpose is to gather the most relevant and accurate information from our various document stores.

You have access to three specialized tools:
1. "knowledgeBaseSearch": Use this for general agricultural guidelines, crop cycles, and standard practices.
2. "expertAnswersSearch": Use this to find how human experts (Agriculture Officers) have answered similar specific queries in the past.
3. "specializedCategorySearch": Use this when the user's query is clearly focused on a specific crop or technical category.

Instructions:
- Analyze the user's request and decide which tool(s) will provide the best information.
- You can use multiple tools if needed to provide a comprehensive set of documents.
- Present the retrieved information clearly, noting the source (Knowledge Base vs. Expert Answer).
- If no information is found, state that clearly and suggest what other details might help in the search.
- Do not make up information; only report what you retrieve.
`;

export const docRetriever = createAgent({
  model: llm,
  name: "DocRetriever",
  systemPrompt,
  checkpointer,
  tools: [knowledgeBaseSearch, expertAnswersSearch, specializedCategorySearch],
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
      config
    );

    // Return the last message from the subagent's response
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content;
  },
  {
    name: "docRetriever",
    description: "A specialized subagent that searches multiple document sources (knowledge base, expert answers, category-specific docs) to find the best agricultural information.",
    schema: z.object({
      query: z.string().describe("The specific question or topic to search for documents on."),
    }),
  }
);
