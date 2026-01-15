import { HumanMessage } from "@langchain/core/messages";
import { krishiAgent } from "../agents/krishiAgent";

export async function runAgentWithStatus(
  query: string,
  send: (event: string, data: any) => void
) {
  const result = await krishiAgent.invoke(
    { messages: [new HumanMessage(query)] },
    {
      callbacks: [
        {
          handleLLMStart() {
            send("status", { type: "thinking" });
          },
          handleAgentAction(action) {
            send("status", {
              type: "tool_call",
              tool: action.tool,
            });
          },
          handleToolStart(tool) {
            send("status", { type: "tool_start", tool: tool.name });
          },
          handleToolEnd(output) {
            send("status", { type: "tool_end", output });
          },
        },
      ],
    }
  );

  return result.messages.at(-1)?.content;
}
