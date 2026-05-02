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
    const { userId, title, message } = payload;
    const user = await User.findById(userId);
    const fcmTokens = user?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(
        `No FCM tokens found for user ${userId}. Skipping notification.`,
      );
      return;
    }

    let resp = null;
    const notificationPayload = {
      notification: {
        title,
        body: message,
      },
      data: {
        url: user?.role === "farmer" ? "/app" : "/dashboard",
      },
    };
    try {
      if (fcmTokens.length === 1) {
        resp = await messaging.send({
          ...notificationPayload,
          token: fcmTokens[0].token,
        });
        return;
      }

      const tokens = fcmTokens.map((t) => t.token);
      resp = await messaging.sendEachForMulticast({
        ...notificationPayload,
        tokens,
      });

      if (resp.failureCount > 0) {
        const failedTokens: string[] = [];
        resp.responses.forEach((response, idx) => {
          if (!response.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        await User.updateOne(
          { _id: userId },
          { $pull: { fcmTokens: { token: { $in: failedTokens } } } },
        );
      }

      console.log("resp", resp);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  },
);
