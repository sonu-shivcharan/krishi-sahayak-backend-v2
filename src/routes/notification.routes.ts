import { Router } from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verifyUser(), getMyNotifications);
router.patch("/mark-all-read", verifyUser(), markAllNotificationsAsRead);
router.patch("/:notificationId/read", verifyUser(), markNotificationAsRead);

export default router;
