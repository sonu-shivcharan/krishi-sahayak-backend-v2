import { Types } from "mongoose";

export interface IConversation {
  _id: Types.ObjectId;
  user: Types.ObjectId; // owner (farmer)
  createdAt: Date;
  updatedAt: Date;
}
