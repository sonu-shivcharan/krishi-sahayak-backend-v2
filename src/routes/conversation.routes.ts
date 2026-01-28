import { Router } from "express";
import {
  getUserConversations,
  sendMessage,
  startConversation,
} from "../controllers/conversation.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/start", verifyClerkToken, startConversation);
router.post("/:conversationId", verifyClerkToken, sendMessage);

export default router;
