import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.types";
import { NotificationType } from "../types/enums";

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
      queryId: Schema.Types.ObjectId,
      conversationId: Schema.Types.ObjectId,
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

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
