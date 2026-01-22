import { Router } from "express";
import {
  chatController,
  createGeminiLiveToken,
} from "../controllers/chat.controller";

const router = Router();

router.post("/", chatController);
router.post("/create-gemini-live-token", createGeminiLiveToken);
export default router;
