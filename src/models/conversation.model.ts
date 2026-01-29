import mongoose, { Schema, AggregatePaginateModel } from "mongoose";
import { IConversation } from "../types/conversation.types";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const ConversationSchema = new Schema<IConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
ConversationSchema.index({ user: 1, updatedAt: -1 });
ConversationSchema.plugin(mongooseAggregatePaginate);

export const Conversation = mongoose.model<
  IConversation,
  AggregatePaginateModel<IConversation>
>("Conversation", ConversationSchema);
