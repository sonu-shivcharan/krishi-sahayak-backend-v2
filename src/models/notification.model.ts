import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.types";
import { NotificationType } from "../types/enums";
import { notificationService } from "../services/notification.service";

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: String,
    message: String,
    data: {
      queryId: {
        type: Schema.Types.ObjectId,
        ref: "ForwardedQuery",
      },
      conversationId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

NotificationSchema.post("save", function (doc) {
  console.log("sending notification for doc:", doc);
  notificationService.sendNotification({
    userId: doc.user.toString(),
    title: doc.title as string,
    message: doc.message as string,
  });
});
export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
