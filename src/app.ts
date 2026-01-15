import express from "express";
import chatRoutes from "./routes/chat.routes";

export const app = express();

app.use(express.json());
app.use("/api", chatRoutes);
