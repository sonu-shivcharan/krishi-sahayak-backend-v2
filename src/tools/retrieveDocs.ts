import { tool } from "langchain";
import z from "zod";
import { loadPdf } from "../utils/pdfLoader";

export const docsRetriever = tool(
  async ({ query }) => {
    const docs = await loadPdf();
    return `Retrieving documents for query: ${docs[0].pageContent}`;
  },
  {
    name: "docsRetriever",
    description: "Search the customer database for records matching the query.",
    schema: z.object({ query: z.string().describe("Users query") }),
  }
);
