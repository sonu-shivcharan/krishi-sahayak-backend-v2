import { Router } from "express";
import {
  sendMessage,
  startConversation,
} from "../controllers/conversation.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/:conversationId", verifyClerkToken, sendMessage);
router.post("/start", verifyClerkToken, startConversation);

export default router;
