import { Types } from "mongoose";
import { NotificationType } from "./enums";

export interface INotification {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title?: string;
  message?: string;
  data?: {
    queryId?: Types.ObjectId;
    conversationId?: Types.ObjectId;
  };
  isRead: boolean;
  createdAt: Date;
}
