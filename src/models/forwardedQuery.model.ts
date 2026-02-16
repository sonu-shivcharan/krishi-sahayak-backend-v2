import mongoose, { Schema, AggregatePaginateModel } from "mongoose";
import { IForwardedQuery } from "../types/forwardedQuery.types";
import { ForwardedQueryStatus } from "../types/enums";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
    targetOfficers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    location: {
      type: new Schema(
        {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true,
          },
          coordinates: {
            type: [Number], // [lng, lat]
            required: true,
            validate: {
              validator(coords: number[]) {
                return (
                  Array.isArray(coords) &&
                  coords.length === 2 &&
                  Number.isFinite(coords[0]) &&
                  Number.isFinite(coords[1]) &&
                  coords[0] >= -180 &&
                  coords[0] <= 180 &&
                  coords[1] >= -90 &&
                  coords[1] <= 90
                );
              },
              message: "Coordinates must be [longitude, latitude]",
            },
          },
          district: String,
          taluka: String,
        },
        { _id: false },
      ),
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(ForwardedQueryStatus),
      default: ForwardedQueryStatus.PENDING,
      index: true,
    },
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    claimedAt: Date,
    answeredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    answer: String,
    answeredAt: Date,
    forwardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

// Index for efficient querying
ForwardedQuerySchema.index({ conversation: 1 });
ForwardedQuerySchema.index({ forwardedBy: 1 });
// Status is already indexed in schema definition
ForwardedQuerySchema.index({ "location.district": 1, "location.taluka": 1 });
ForwardedQuerySchema.index(
  { location: "2dsphere" },
  { partialFilterExpression: { location: { $exists: true } } },
);

ForwardedQuerySchema.plugin(mongooseAggregatePaginate);
export const ForwardedQuery = mongoose.model<
  IForwardedQuery,
  AggregatePaginateModel<IForwardedQuery>
>("ForwardedQuery", ForwardedQuerySchema);
