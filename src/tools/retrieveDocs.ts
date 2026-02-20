// tools/docsRetriever.ts
import { tool } from "langchain";
import z from "zod";
import { qdrantClient, COLLECTION_NAME } from "../utils/qdrantStore";

export const docsRetriever = tool(
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
      .map(
        (point, i) => `Source ${i + 1}:\n${point.payload?.page_content ?? ""}`,
      )
      .join("\n\n");
  },
  {
    name: "docsRetriever",
    description:
      "Retrieve relevant agriculture-related documents from the knowledge base to answer farmer queries about crops, diseases, treatments, and government schemes.",
    schema: z.object({
      query: z
        .string()
        .describe("User question to search in agriculture knowledge base"),
    }),
  },
);
