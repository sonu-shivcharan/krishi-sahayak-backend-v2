// Step 1: Define tools and model
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { task, entrypoint } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { ToolCall } from "@langchain/core/messages/tool";
import { addMessages } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
});

// Define tools
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const toolsByName = {
  [add.name as string]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

const callLlm = task({ name: "callLlm" }, async (messages: BaseMessage[]) => {
  return modelWithTools.invoke([
    new SystemMessage(
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
    ),
    ...messages,
  ]);
});

const callTool = task({ name: "callTool" }, async (toolCall: ToolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});

const agent = entrypoint({ name: "agent" }, async (messages: BaseMessage[]) => {
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) {
      break;
    }

    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  return messages;
});

export async function* streamAgent(query: string) {
  const stream = await agent.stream([new HumanMessage(query)]);

  for await (const chunk of stream) {
    if (chunk.callLlm) {
      const message = chunk.callLlm;
      if (typeof message.content === "string" && !message.tool_calls?.length) {
        yield message.content;
      }
    }
  }
}
