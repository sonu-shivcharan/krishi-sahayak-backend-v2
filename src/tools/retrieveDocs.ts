import { tool } from "langchain";
import z from "zod";
import { getQdrantStore } from "../utils/qdrantStore";

export const docsRetriever = tool(
  async ({ query }) => {
    const vectorStore = await getQdrantStore();

    const results = await vectorStore.similaritySearch(query, 5);

    console.log("Qdrant results:", results);

    return results
      .map((doc, i) => `Source ${i + 1}:\n${doc.pageContent}`)
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
  }
);
