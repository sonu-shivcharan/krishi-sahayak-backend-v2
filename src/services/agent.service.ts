import { HumanMessage } from "@langchain/core/messages";
import { krishiAgent } from "../agents/krishiAgent";

export async function runAgentWithStatus({
  query,
  sendFn,
  conversationId,
}: {
  query: string;
  sendFn: (event: string, data: any) => void;
  conversationId: string;
}): Promise<string | undefined> {
  const result = await krishiAgent.invoke(
    { messages: [new HumanMessage(query)] },
    {
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
