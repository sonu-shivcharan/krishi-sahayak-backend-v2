import { Router } from "express";
import {
  chatController,
  createGeminiLiveToken,
} from "../controllers/chat.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();

// verifyClerkToken returns JSON error instead of redirecting
router.post("/", verifyClerkToken, chatController);
router.post("/create-gemini-live-token", createGeminiLiveToken);
export default router;
