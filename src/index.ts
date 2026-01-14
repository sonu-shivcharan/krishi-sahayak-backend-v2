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
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs ypu are also good at coding "
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
  const messages: BaseMessage[] = [new HumanMessage(query)];
  
  while (true) {
    const stream = await model.stream([
      new SystemMessage(
        "You are a helpful assistant tasked with performing arithmetic on a set of inputs ypu are also good at coding "
      ),
      ...messages,
    ]);

    let fullResponse = "";
    const chunks: any[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (typeof chunk.content === "string" && chunk.content) {
        fullResponse += chunk.content;
        yield chunk.content;
      }
    }

    const lastChunk = chunks[chunks.length - 1];
    if (!lastChunk?.tool_calls?.length) {
      break;
    }

    messages.push(lastChunk);
    const toolResults = await Promise.all(
      lastChunk.tool_calls.map((toolCall: ToolCall) => callTool(toolCall))
    );
    messages.push(...toolResults);
  }
}
