import mongoose, { Schema } from "mongoose";
import { IForwardedQuery } from "../types/forwardedQuery.types";
import { ForwardedQueryStatus } from "../types/enums";

const ForwardedQuerySchema = new Schema<IForwardedQuery>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    forwardedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answeredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    answer: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ForwardedQueryStatus),
      required: true,
      default: ForwardedQueryStatus.PENDING,
    },
    forwardedAt: {
      type: Date,
      default: Date.now,
    },
    answeredAt: {
      type: Date,
    },
  },
  {
    timestamps: false, // Using custom timestamp fields
  },
);

// Index for efficient querying
ForwardedQuerySchema.index({ conversation: 1 });
ForwardedQuerySchema.index({ forwardedBy: 1 });
ForwardedQuerySchema.index({ answeredBy: 1 });

export const ForwardedQuery = mongoose.model<IForwardedQuery>(
  "ForwardedQuery",
  ForwardedQuerySchema,
);
