import { Types } from "mongoose";
import { ForwardedQueryStatus } from "./enums";

export interface IForwardedQuery {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  forwardedBy: Types.ObjectId;
  answeredBy?: Types.ObjectId;
  answer?: string;
  files?: Types.ObjectId[];
  status: ForwardedQueryStatus;
  forwardedAt: Date;
  answeredAt?: Date;
}
