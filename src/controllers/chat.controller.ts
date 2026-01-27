import { Request, Response } from "express";
import { runAgentWithStatus } from "../services/agent.service";
import { AuthToken, GoogleGenAI } from "@google/genai";
import { Conversation } from "../models";

export async function chatController(req: Request, res: Response) {
  const { query, conversationId } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (event: string, data: any) => {
    res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
  };

  const result = await runAgentWithStatus({
    query,
    conversationId,
    sendFn: send,
  });

  send("final", {
    answer: result,
  });

  res.end();
}

export const createGeminiLiveToken = async (req: Request, res: Response) => {
  const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  });
  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const token: AuthToken = await client.authTokens.create({
    config: {
      uses: 1,
      expireTime: expireTime,
      newSessionExpireTime: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // Default 1 minute in the future
      httpOptions: { apiVersion: "v1alpha" },
    },
  });

  res.status(200).json({ message: "Token creation endpoint", token });
};
async function createCoversation() {
  Conversation.create({ user: "" });
}
