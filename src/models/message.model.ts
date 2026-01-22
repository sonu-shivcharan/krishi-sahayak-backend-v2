import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types/message.types";
import { MessageSenderRole, MessageType } from "../types/enums";

const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: Object.values(MessageSenderRole),
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    files: [
      {
        type: Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Using custom createdAt field
  }
);

// Index for efficient querying
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
