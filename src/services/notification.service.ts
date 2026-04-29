import EventEmitter from "node:events";
import { User } from "../models";
import { messaging } from "../config/firebase";
type SendNotificationPayload = {
  userId: string;
  title: string;
  message: string;
};
class NotificationService extends EventEmitter {
  constructor() {
    super();
  }

  async sendNotification({ userId, title, message }: SendNotificationPayload) {
    this.emit("notification.send", {
      userId,
      title,
      message,
    });
  }
}

export const notificationService = new NotificationService();

notificationService.on(
  "notification.send",
  async (payload: SendNotificationPayload) => {
    console.log("Notification send event received with payload:", payload);

    const { userId, title, message } = payload;
    const user = await User.findById(userId);
    const fcmTokens = user?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(
        `No FCM tokens found for user ${userId}. Skipping notification.`,
      );
      return;
    }
    const tokens = fcmTokens.map((t) => t.token);
    const notificationPayload = {
      notification: {
        title,
        body: message,
      },
      tokens,
    };
    messaging
      .sendEachForMulticast(notificationPayload)
      .then((response) => {
        console.log(
          `Successfully sent notification to user ${userId}. Response:`,
          response,
        );
      })
      .catch((error) => {
        console.error(`Error sending notification to user ${userId}:`, error);
      });
  },
);
