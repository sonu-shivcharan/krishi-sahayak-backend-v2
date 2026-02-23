import { tool } from "langchain";
import z from "zod";
import { qdrantClient, COLLECTION_NAME, QDRANT_COLLECTIONS } from "../utils/qdrantStore";

/**
 * Searches the official agriculture knowledge base using semantic search.
 */
export const knowledgeBaseSearch = tool(
  async ({ query }) => {
    const result = await qdrantClient.query(COLLECTION_NAME, {
      query: {
        text: query,
        model: "sentence-transformers/all-minilm-l6-v2",
      },
      limit: 5,
      with_payload: true,
    });

    return result.points
      .map((point, i) => `[Knowledge Base Point ${i + 1}]\n${point.payload?.page_content ?? ""}`)
      .join("\n\n") || "No matching documents found in the Knowledge Base.";
  },
  {
    name: "knowledgeBaseSearch",
    description: "Search the official agriculture knowledge base for general farming advice, disease info, and crop management.",
    schema: z.object({
      query: z.string().describe("The search query for the knowledge base"),
    }),
  }
);

/**
 * Searches specifically through past officer answers and expert consultations.
 */
export const expertAnswersSearch = tool(
  async ({ query }) => {
    const result = await qdrantClient.query(QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS, {
      query: {
        text: query,
        model: "sentence-transformers/all-minilm-l6-v2",
      },
      limit: 3,
      with_payload: true,
    });

    return result.points
      .map((point, i) => `[Expert Answer ${i + 1}]\nQuestion: ${point.payload?.question}\nAnswer: ${point.payload?.answer}`)
      .join("\n\n") || "No relevant expert answers found for this query.";
  },
  {
    name: "expertAnswersSearch",
    description: "Search through previous expert answers and solved case studies from agriculture officers.",
    schema: z.object({
      query: z.string().describe("The search query for expert answers"),
    }),
  }
);

/**
 * Searches the knowledge base with a focus on specific crops or categories if possible.
 */
export const specializedCategorySearch = tool(
  async ({ query, category }) => {
    // In a real scenario, we would use Qdrant filters. 
    // For now, we enhance the query and increase the limit to find better matches.
    const enhancedQuery = `${category} ${query}`;
    const result = await qdrantClient.query(COLLECTION_NAME, {
      query: {
        text: enhancedQuery,
        model: "sentence-transformers/all-minilm-l6-v2",
      },
      limit: 5,
      with_payload: true,
    });

    return result.points
      .map((point, i) => `[Category: ${category}] Point ${i + 1}:\n${point.payload?.page_content ?? ""}`)
      .join("\n\n") || `No specific info found for ${category}.`;
  },
  {
    name: "specializedCategorySearch",
    description: "Search the knowledge base filtered by a specific crop or agricultural category (e.g., Rice, Pest Control, Fertilizers).",
    schema: z.object({
      query: z.string().describe("The search query"),
      category: z.string().describe("The crop or category to focus on (e.g. Wheat, Pest, Irrigation)"),
    }),
  }
);
