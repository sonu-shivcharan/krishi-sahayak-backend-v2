import { Router } from "express";
import {
  getUserConversations,
  sendMessage,
  startConversation,
} from "../controllers/conversation.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyClerkToken);
router.get("/", getUserConversations);
router.post("/start", startConversation);
router.post("/:conversationId", sendMessage);

export default router;
