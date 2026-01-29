import mongoose, { PaginateOptions } from "mongoose";
import { Conversation, Message } from "../models";
import { runAgentWithStatus } from "../services/agent.service";
import { MessageSenderRole, MessageType } from "../types/enums";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { llm } from "../config/llm";

async function generateConversationTitle(message: string) {
  return (
    await llm.invoke(
      `Write a single concise title that reflects the main idea of the message. Output only the title:\n${message}`,
    )
  ).content as string;
}

async function createConversation(userId: string, title: string) {
  try {
    const conversation = await Conversation.create({ user: userId, title });
    if (!conversation) {
      throw new Error("Conversation not created");
    }
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
}
const startConversation = asyncHandler(async (req, res) => {
  const { message, files } = req.body;
  const userId = req.user._id.toString();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (event: string, data: any) => {
    res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
  };
  const conversationTitle = await generateConversationTitle(message);
  const conversation = await createConversation(userId, conversationTitle);

  const newMessage = await Message.create({
    conversation: conversation._id.toString(),
    sender: userId,
    senderRole: MessageSenderRole.FARMER,
    type: MessageType.TEXT,
    text: message,
    files,
  });
  if (!newMessage) {
    throw new ApiError(500, "failed to create a message");
  }
  send("initial", {
    conversationId: conversation._id.toString(),
    conversationTitle,
    messageId: newMessage._id.toString(),
  });
  const result = await runAgentWithStatus({
    query: message,
    conversationId: conversation._id.toString(),
    sendFn: send,
  });

  send("final", {
    answer: result,
  });
  const aiMessage = await Message.create({
    conversation: conversation._id,
    senderRole: MessageSenderRole.BOT,
    type: MessageType.TEXT,
    text: result,
  });

  res.end();
});

const sendMessage = asyncHandler(async (req, res) => {
  const { message, files } = req.body;
  const { conversationId } = req.params;
  const userId = req.user._id.toString();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (event: string, data: any) => {
    res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
  };

  const newMessage = await Message.create({
    conversation: conversationId,
    sender: userId,
    senderRole: MessageSenderRole.FARMER,
    type: MessageType.TEXT,
    text: message,
    files,
  });
  if (!newMessage) {
    throw new ApiError(500, "failed to create a message");
  }
  send("initial", {
    messageId: newMessage._id.toString(),
  });

  const result = await runAgentWithStatus({
    query: message,
    conversationId: conversationId as string,
    sendFn: send,
  });

  send("final", {
    answer: result,
  });
  const aiMessage = await Message.create({
    conversation: conversationId,
    senderRole: MessageSenderRole.BOT,
    type: MessageType.TEXT,
    text: result,
  });

  res.end();
});

const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const options: PaginateOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    offset: Number(req.query.skip) || 0,
  };
  const sortBy = (req.query.sortBy as string) || "updatedAt";
  const sortDir = req.query.sortType === "asc" ? 1 : -1; // or '1'/'-1'
  const conversations = await Conversation.aggregatePaginate(
    [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: { [sortBy]: sortDir },
      },
    ],
    {
      ...options,
    },
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userId, conversations },
        "User conversations fetched sucessfully",
      ),
    );
});

export { startConversation, sendMessage, getUserConversations };
