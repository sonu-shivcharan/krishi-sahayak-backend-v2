import mongoose, { Schema } from "mongoose";
import { IConversation } from "../types/conversation.types";

const ConversationSchema = new Schema<IConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Using custom createdAt and updatedAt fields
  }
);

// Update updatedAt before saving
ConversationSchema.pre("save", function () {
  this.updatedAt = new Date();
  
});

// Index for efficient querying
ConversationSchema.index({ user: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);
