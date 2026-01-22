import express from "express";
import cors from "cors";
export const app = express();
import { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/apiError";

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";

app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/users", userRoutes);


//global error handler
app.use((error: ApiError | Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (error as ApiError).statusCode || 500;
  const message = error.message || "Something went wrong";
  const errors = (error as ApiError).errors || [];
  return res
    .status(status)
    .json({ statusCode: status, message, errors, success: false });
});