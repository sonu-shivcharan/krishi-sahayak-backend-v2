import mongoose, { Schema } from "mongoose";
import { IConversation } from "../types/conversation.types";

const ConversationSchema = new Schema<IConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
ConversationSchema.index({ user: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
