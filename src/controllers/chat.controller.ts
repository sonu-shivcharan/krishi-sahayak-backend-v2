import { Request, Response } from "express";
import { runAgentWithStatus } from "../services/agent.service";

export async function chatController(req: Request, res: Response) {
  const { query } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event: string, data: any) => {
    res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
  };

  const result = await runAgentWithStatus(query, send);

  send("final", {
    answer: result,
  });

  res.end();
}
