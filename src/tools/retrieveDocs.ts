import { tool } from "langchain";
import z from "zod";
import { loadPdf } from "../utils/pdfLoader";

export const docsRetriever = tool(
  async ({ query }) => {
    const vectoreStrore = await loadPdf();
    const results = await vectoreStrore.similaritySearch(query, 5);
    // results.forEach((doc, i) => {
    //   console.log(`Result ${i + 1}:`);
    //   console.log(doc.pageContent);
    // });
    console.log("results.length", results.length);
    return results.map((doc) => doc.pageContent).join("\n\n");
  },
  {
    name: "docsRetriever",
    description: "Search the customer database for records matching the query.",
    schema: z.object({ query: z.string().describe("Users query") }),
  }
);
