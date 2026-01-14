import express from "express";
import { streamAgent } from "./index.js";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    for await (const chunk of streamAgent(query)) {
      res.write(
        `event: response\ndata: ${JSON.stringify({ content: chunk })}\n\n`
      );
    }
    res.write("data: [DONE]\n\n");
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
  } finally {
    res.end();
  }
});
app.get("/", (req, res) => {
  res.send("Server is up and running");
});

interface ErrorRequest extends express.Request {}

interface ErrorResponse extends express.Response {}

app.use(
  (
    err: Error,
    req: ErrorRequest,
    res: ErrorResponse,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close();
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
