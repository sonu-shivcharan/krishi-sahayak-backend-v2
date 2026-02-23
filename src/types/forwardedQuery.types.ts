import { Types } from "mongoose";
import { ForwardedQueryStatus } from "./enums";

export interface IForwardedQuery {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  forwardedBy: Types.ObjectId;
  targetOfficers: Types.ObjectId[];
  question: string;
  summary: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    district?: string;
    taluka?: string;
  };
  status: ForwardedQueryStatus;
  claimedBy?: Types.ObjectId;
  claimedAt?: Date;
  answeredBy?: Types.ObjectId;
  answer?: string;
  answeredAt?: Date;
  reason?: string;
  forwardedAt: Date;
}
