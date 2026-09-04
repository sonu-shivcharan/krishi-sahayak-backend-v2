import { tool } from "langchain";
import z from "zod";
import {
  qdrantClient,
  COLLECTION_NAME,
  QDRANT_COLLECTIONS,
} from "../utils/qdrantStore";
import logger from "../utils/logger";

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

export const CATEGORY_QUERY_TYPES = [
  "Disease Management",
  "Insect Management",
  "Fertilizer Use and Availability",
  "Nutrient Deficiency/Excessiveness Management",
  "Irrigation Management",
  "Seed Sowing And Treatment",
  "Sowing Time and Weather",
] as const;

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
 * Formats points returned by Qdrant category search into readable document snippets.
 */
function formatCategoryPoints(points: any[]): string {
  return (
    points
      .map((point, i) => {
        const crop = point.payload?.crop ? `Crop: ${point.payload.crop}` : null;
        const category = point.payload?.query_type
          ? `Category: ${point.payload.query_type}`
          : null;
        const tags = [crop, category].filter(Boolean).join(" | ");
        const header = tags ? `[${tags}] Point ${i + 1}` : `[Point ${i + 1}]`;

        const question = point.payload?.question
          ? `Question: ${point.payload.question}\n`
          : "";
        const answer =
          point.payload?.answer ??
          point.payload?.pageContent ??
          point.payload?.page_content ??
          "";

        return `${header}\n${question}Answer: ${answer}`;
      })
      .join("\n\n") || "No matching documents found in the Knowledge Base."
  );
}

/**
 * Searches the agriculture knowledge base with support for specific crops or technical categories, falling back to unconstrained semantic search if needed.
 */
export const specializedCategorySearch = tool(
  async ({ query, crop, queryType }) => {
    logger.info(
      `specializedCategorySearch called - Query: "${query}", Crop: "${crop || "none"}", QueryType: "${queryType || "none"}"`,
    );

    const mappedQueryType = queryType
      ? QUERY_TYPE_MAP[queryType.toLowerCase()] || queryType
      : undefined;

    const filterMust: any[] = [];
    if (crop) {
      filterMust.push({ key: "crop", match: { value: crop.toLowerCase() } });
    }
    if (mappedQueryType) {
      filterMust.push({
        key: "query_type",
        match: { value: mappedQueryType },
      });
    }

    const filter = filterMust.length > 0 ? { must: filterMust } : undefined;

    const result = await qdrantClient.query(
      QDRANT_COLLECTIONS.CATEGORY_SEARCH,
      {
        query: {
          text: `query: ${query}`,
          model: "intfloat/multilingual-e5-small",
        },
        ...(filter ? { filter } : {}),
        limit: 5,
        with_payload: true,
      },
    );

    if (!result.points?.length) {
      if (filter) {
        logger.info(
          "No filtered results in category search, retrying without filters...",
        );
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
        if (fallback.points?.length) {
          return formatCategoryPoints(fallback.points);
        }
      }
      return "No matching documents found in the Knowledge Base.";
    }

    return formatCategoryPoints(result.points);
  },
  {
    name: "specializedCategorySearch",
    description:
      "Search the official agriculture knowledge base for general farming advice, crop practices, disease/pest management, fertilizer usage, and irrigation with optional crop and category filtering.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query for agricultural guidance or information"),
      crop: z
        .string()
        .optional()
        .describe(
          "Optional crop name (e.g. wheat, rice, tomato, cotton) to filter results",
        ),
      queryType: z
        .string()
        .optional()
        .describe(
          "Optional query category type (e.g. 'Disease Management', 'Insect Management', 'Fertilizer Use and Availability', 'Nutrient Deficiency/Excessiveness Management', 'Irrigation Management', 'Seed Sowing And Treatment', 'Sowing Time and Weather')",
        ),
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
