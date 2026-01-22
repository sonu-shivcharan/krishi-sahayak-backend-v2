import { Types } from "mongoose";
import { MessageSenderRole, MessageType } from "./enums";

export interface IMessage {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  senderRole: MessageSenderRole;
  type: MessageType;
  text?: string;
  files?: Types.ObjectId[]; // refs to File
  createdAt: Date;
}
