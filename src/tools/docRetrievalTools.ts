import { tool } from "langchain";
import z from "zod";
import {
  qdrantClient,
  COLLECTION_NAME,
  QDRANT_COLLECTIONS,
} from "../utils/qdrantStore";

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

    return (
      result.points
        .map(
          (point, i) =>
            `[Knowledge Base Point ${i + 1}]\n${point.payload?.pageContent ?? point.payload?.page_content ?? ""}`,
        )
        .join("\n\n") || "No matching documents found in the Knowledge Base."
    );
  },
  {
    name: "knowledgeBaseSearch",
    description:
      "Search the official agriculture knowledge base for general farming advice, disease info, and crop management.",
    schema: z.object({
      query: z.string().describe("The search query for the knowledge base"),
    }),
  },
);

/**
 * Searches specifically through past officer answers and expert consultations.
 */
export const expertAnswersSearch = tool(
  async ({ query }) => {
    const result = await qdrantClient.query(
      QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
      {
        query: {
          text: query,
          model: "sentence-transformers/all-minilm-l6-v2",
        },
        limit: 3,
        with_payload: true,
      },
    );

    return (
      result.points
        .map(
          (point, i) =>
            `[Expert Answer ${i + 1}]\nQuestion: ${point.payload?.question}\nAnswer: ${point.payload?.answer}`,
        )
        .join("\n\n") || "No relevant expert answers found for this query."
    );
  },
  {
    name: "expertAnswersSearch",
    description:
      "Search through previous expert answers and solved case studies from agriculture officers.",
    schema: z.object({
      query: z.string().describe("The search query for expert answers"),
    }),
  },
);

const QUERY_TYPE_MAP: Record<string, string> = {
  // Disease / Pest
  disease: "Disease Management",
  fungus: "Disease Management",
  infection: "Disease Management",

  pest: "Insect Management",
  insect: "Insect Management",
  bugs: "Insect Management",

  // Nutrients
  fertilizer: "Fertilizer Use and Availability",
  urea: "Fertilizer Use and Availability",
  npk: "Fertilizer Use and Availability",

  deficiency: "Nutrient Deficiency/Excessiveness Management",
  yellow: "Nutrient Deficiency/Excessiveness Management",

  // Water
  irrigation: "Irrigation Management",
  water: "Irrigation Management",
  drip: "Irrigation Management",

  // Seeds / planting
  seed: "Seed Sowing And Treatment",
  sowing: "Sowing Time and Weather",
};

/**
 * Searches the knowledge base with a focus on specific crops or categories if possible.
 */
export const specializedCategorySearch = tool(
  async ({ query, crop, queryType }) => {
    console.log("query", query, queryType, crop);
    const result = await qdrantClient.query(
      QDRANT_COLLECTIONS.CATEGORY_SEARCH,
      {
        query: {
          text: `query: ${query}`,
          model: "intfloat/multilingual-e5-small",
        },

        filter: {
          must: [
            ...(crop
              ? [{ key: "crop", match: { value: crop.toLowerCase() } }]
              : []),

            ...(queryType
              ? [
                  {
                    key: "query_type",
                    match: { value: QUERY_TYPE_MAP[queryType] },
                  },
                ]
              : []),
          ],
        },

        limit: 5,
        with_payload: true,
      },
    );

    if (!result.points?.length) {
      console.log("⚠️ No filtered results, retrying without filters...");

      const fallback = await qdrantClient.query(
        QDRANT_COLLECTIONS.CATEGORY_SEARCH,
        {
          query: {
            text: `query: ${query}`,
            model: "intfloat/multilingual-e5-small",
          },
          limit: 5,
          with_payload: true,
        },
      );
      console.log("fallback", JSON.stringify(fallback));
      return (
        fallback.points
          ?.map((point, i) => `Point ${i + 1}:\n${point.payload?.answer ?? ""}`)
          .join("\n\n") || "No results found."
      );
    }
    console.log("result.points", result.points);
    return (
      result.points
        ?.map(
          (point, i) =>
            `[${point.payload?.crop} | ${point.payload?.query_type}] Point ${i + 1}:${point.payload?.question}\n${point.payload?.answer ?? ""}`,
        )
        .join("\n\n") || "No results found."
    );
  },
  {
    name: "specializedCategorySearch",
    description: "Search knowledge base using crop and query type filtering.",
    schema: z.object({
      query: z.string().describe("User query"),
      crop: z.string().optional().describe("Crop name (e.g. wheat, rice)"),
      queryType: z
        .string()
        .optional()
        .describe(`Query type (${Object.keys(QUERY_TYPE_MAP).toString()})`),
    }),
  },
);
/**
 * Searches for government schemes and subsidies in the specialized collection.
 */
export const governmentSchemesSearch = tool(
  async ({ query }) => {
    const result = await qdrantClient.query(
      QDRANT_COLLECTIONS.GOVERNMENT_SCHEMES,
      {
        query: {
          text: query,
          model: "sentence-transformers/all-minilm-l6-v2",
        },
        limit: 5,
        with_payload: true,
      },
    );

    return (
      result.points
        .map(
          (point, i) =>
            `[Government Scheme Point ${i + 1}]\n${point.payload?.pageContent ?? point.payload?.page_content ?? ""}`,
        )
        .join("\n\n") || "No government schemes found matching your query."
    );
  },
  {
    name: "governmentSchemesSearch",
    description:
      "Search for government schemes, subsidies, and eligibility criteria for farmers.",
    schema: z.object({
      query: z.string().describe("The search query for government schemes"),
    }),
  },
);
