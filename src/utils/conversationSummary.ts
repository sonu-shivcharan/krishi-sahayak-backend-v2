import { checkpointer } from "../agents/krishiAgent";
import { llm } from "./llm";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";

export const generateConversationSummary = async ({
  conversationId,
  language = "English",
}: {
  conversationId: string;
  language?: string;
}): Promise<string> => {
  try {
    const config = { configurable: { thread_id: conversationId } };
    const checkpointTuple = await checkpointer.getTuple(config);

    if (!checkpointTuple) {
      return "No conversation history found.";
    }

    const messages =
      (checkpointTuple.checkpoint.channel_values?.messages as BaseMessage[]) ||
      [];

    if (messages.length === 0) {
      return "No messages in the conversation.";
    }

    // Format the conversation history for context
    const formattedHistory = messages
      .map((msg) => {
        const role =
          msg.type === "human" ? "Farmer" : "Krishi Sahayak AI Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    const summaryPrompt = `
You are summarizing this conversation for a HUMAN AGRICULTURAL OFFICER.
Create a brief, clear summary focusing on:
1. The farmer's most recent question or request.
2. The immediate problem they need help with.
3. Any key context needed to answer (crop, issue, location, actions taken).
Keep it concise, practical, and easy to act on.
Mention missing details the officer should ask for, if any.
Conversation History:
${formattedHistory}
Officer Summary (in ${language}):
`;

    // Invoke LLM directly (stateless) so this summary interaction is NOT saved to DB
    const response = await llm.invoke([
      new SystemMessage(
        "You are a helpful assistant that summarizes conversations.",
      ),
      new HumanMessage(summaryPrompt),
    ]);

    return response.content as string;
  } catch (error) {
    console.error("Error generating conversation summary:", error);
    return "Failed to generate conversation summary.";
  }
};

export const generateQuestionFromSummary = async (summary: string): Promise<string> => {
  try {
    const questionPrompt = `
Based on the following conversation summary, generate a concise, 1 or 2 sentence question that represents the main issue or request of the farmer.

Summary:
${summary}

Question:`;

    const response = await llm.invoke([
      new SystemMessage(
        "You are a helpful assistant that generates a concise question from a summary.",
      ),
      new HumanMessage(questionPrompt),
    ]);

    return response.content as string;
  } catch (error) {
    console.error("Error generating question from summary:", error);
    return "What is the farmer's question?";
  }
};
