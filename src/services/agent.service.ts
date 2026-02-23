import { HumanMessage } from "@langchain/core/messages";
import { ContextSchema, krishiAgent } from "../agents/krishiAgent";

/**@deprecated use executeAgent instead */
export async function runAgentWithStatus({
  query,
  sendFn,
  conversationId,
  userId,
  region,
}: {
  query: string;
  sendFn: (event: string, data: any) => void;

  conversationId: string;
  userId?: string;
  region?: string;
}): Promise<string | undefined> {
  const result = await krishiAgent.invoke(
    { messages: [new HumanMessage(query)] },
    {
      context: {
        userId,
        conversationId,
        region,
      },
      configurable: { thread_id: conversationId },
      callbacks: [
        {
          handleLLMStart() {
            sendFn("status", { type: "thinking" });
          },
          handleAgentAction(action) {
            sendFn("status", {
              type: "tool_call",
              tool: action.tool,
            });
          },
          handleToolStart(tool) {
            sendFn("status", { type: "tool_start", tool: tool.name });
          },
          handleToolEnd(output) {
            sendFn("status", { type: "tool_end", status: output.status });
          },
        },
      ],
    },
  );

  return result.messages.at(-1)?.content.toString();
}

interface ExecuteAgentParams {
  query: string;
  conversationId: string;
  sendResponseFn: (event: string, data: any) => void;
  context?: ContextSchema;
  region?: string;
}
export async function executeAgent({
  query,
  conversationId,
  sendResponseFn,
  context,
}: ExecuteAgentParams) {
  console.log("conversationId", conversationId);
  const stream = krishiAgent.streamEvents(
    {
      messages: [new HumanMessage(query)],
    },
    {
      context: { ...context, conversationId },
      configurable: { thread_id: conversationId },
      callbacks: [
        {
          handleLLMStart() {
            sendResponseFn("status", { type: "thinking" });
          },
          handleToolStart(
            tool,
            input,
            runId,
            _parentRunId,
            _tags,
            _metadata,
            runName,
          ) {
            sendResponseFn("status", { type: "toolCall", name: tool.name });
          },
          handleToolEnd(output, runId, parentRunId, tags) {
            sendResponseFn("status", {
              type: "toolCall",
              name: output.name,
            });
          },
          // handleLLMEnd(output, runId, parentRunId, tags, extraParams) {
          //   sendResponseFn("status", { type: "processing" });
          // },
        },
      ],
    },
  );
  let fullMessage = "";
  for await (const chunk of stream) {
    const chunkContent = chunk.data.chunk?.content;
    if (chunkContent) {
      const data = {
        chunkContent,
      };
      fullMessage += data.chunkContent;
      sendResponseFn("chunk", data);
    }
  }
  return fullMessage;
}
