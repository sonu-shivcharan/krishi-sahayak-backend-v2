import mongoose, { isValidObjectId, PaginateOptions } from "mongoose";
import { Conversation, Message } from "../models";
import { executeAgent } from "../services/agent.service";
import { MessageSenderRole, MessageType } from "../types/enums";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { llm } from "../utils/llm";
import { krishiAgent } from "../agents/krishiAgent";
import { HumanMessage } from "langchain";

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
  const { message, files, region } = req.body;
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
  console.log("message", message);
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

  const result = await executeAgent({
    query: message,
    conversationId: conversation._id.toString(),
    sendResponseFn: send,
    context: { userId, region },
  });
  send("end", null);
  await Message.create({
    conversation: conversation._id,
    senderRole: MessageSenderRole.BOT,
    type: MessageType.TEXT,
    text: result,
  });

  res.end();
});

const sendMessage = asyncHandler(async (req, res) => {
  const { message, files, region } = req.body;
  const { conversationId } = req.params;
  if (!isValidObjectId(conversationId)) {
    throw new ApiError(409, "Invalid conversationId");
  }
  const userId = req.user._id.toString();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: any) => {
    res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
  };

  try {
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

    const result = await executeAgent({
      query: message,
      conversationId: conversationId.toString(),
      sendResponseFn: send,
      context: { userId, region },
    });

    // creating ai message
    await Message.create({
      conversation: conversationId,
      senderRole: MessageSenderRole.BOT,
      type: MessageType.TEXT,
      text: result,
    });
    send("end", null);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    send("error", {
      message:
        "An error occurred while processing your message. Please try again.",
    });
  } finally {
    res.end();
  }
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

const getUserConversationMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { conversationId } = req.params;
  const options: PaginateOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    offset: Number(req.query.skip) || 0,
    customLabels: {
      docs: "messages",
    },
  };
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = req.query.sortType === "asc" ? 1 : -1; // or '1'/'-1'

  if (!isValidObjectId(conversationId)) {
    throw new ApiError(409, "Invalid conversationId");
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  if (conversation.user.toString() !== userId) {
    throw new ApiError(403, "Unauthorized");
  }
  const messages = await Message.aggregatePaginate(
    [
      {
        $match: {
          conversation: new mongoose.Types.ObjectId(conversationId.toString()),
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
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: conversation._id,
        title: conversation.title,
        ...messages,
      },
      "User conversation fetched successfully",
    ),
  );
});
const testStreamEvents = asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const { message, conversationId } = req.body;
  const stream = krishiAgent.streamEvents(
    {
      messages: [new HumanMessage(message)],
    },
    {
      streamMode: "updates",
      configurable: { thread_id: conversationId },
      context: { userId: req.user._id.toString(), conversationId },
    },
  );

  for await (let e of stream) {
    const chunkContent = e.data.chunk?.content;
    if (chunkContent) {
      const data = {
        chunkContent,
      };
      // console.log("chunkContent", chunkContent);
      res.write(`event: chunk\ndata:${JSON.stringify(data)}\n\n`);
      console.log("e", chunkContent);
    }
    if (e.data.output) {
      const messages = e.data.output?.messages;
      if (messages) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.content) {
          for (const c of lastMessage.content) {
            if (c.type === "functionCall") {
              res.write(
                `event:${"functionCall"}\ndata:${JSON.stringify(c)}\n\n`,
              );
            }
          }
        }
        // res.write(
        //   `event:${"message"}\ndata:${JSON.stringify(lastMessage?.content)}\n\n`,
        // );
      }
    }
  }
  res.write(`event:${"end"}\ndata:null}\n\n`);
  return res.end();
});

export {
  startConversation,
  sendMessage,
  getUserConversations,
  getUserConversationMessages,
  testStreamEvents,
};
