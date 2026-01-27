import express from "express";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/apiError";
import { clerkMiddleware } from "@clerk/express";
import logger from "./utils/logger";
import morgan from "morgan";

export const app = express();

// basic config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(","),
  credentials: true,
  methods: ["POST", "PATCH", "PUT", "DELETE", "OPTIONS", "GET"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  exposedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Ensure CORS headers are set on all responses (including errors)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:5173",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST, PATCH, PUT, DELETE, OPTIONS, GET",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Requested-With",
    );
  }
  next();
});

// Clerk middleware - must be added before routes
// This automatically verifies JWT tokens and adds req.auth
app.use(clerkMiddleware());

import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import conversationRoutes from "./routes/conversation.routes";

app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/conversations", conversationRoutes);

//global error handler
app.use(
  (
    error: ApiError | Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    logger.error(
      `Error occurred: ${error.message} | Status: ${
        (error as ApiError).statusCode
      }`,
    );
    const status = (error as ApiError).statusCode || 500;
    const message = error.message || "Something went wrong";
    const errors = (error as ApiError).errors || [];
    return res
      .status(status)
      .json({ statusCode: status, message, errors, success: false });
  },
);
