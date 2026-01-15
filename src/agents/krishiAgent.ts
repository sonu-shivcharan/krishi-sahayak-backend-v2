import { createAgent } from "langchain";
import { llm } from "../config/llm";
import { docsRetriever } from "../tools/retrieveDocs";

export const krishiAgent = createAgent({
  model: llm,
  name: "KrishiSahayak",
  systemPrompt: `You are krishi sahayak a Digital Krishi Officer you have access to the tool 'docsRetriever" you can use this tool for answering complex question`,
  tools: [docsRetriever],
});
