import { Router } from "express";
import {
  getUserConversationMessages,
  getUserConversations,
  sendMessage,
  startConversation,
  testStreamEvents,
} from "../controllers/conversation.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyClerkToken);
router.get("/", getUserConversations);
router.post("/start", startConversation);
router.post("/test", testStreamEvents);
router.post("/:conversationId", sendMessage);
router.get("/:conversationId", getUserConversationMessages);

export default router;
