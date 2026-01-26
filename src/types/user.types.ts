import { Types } from "mongoose";
import { UserRole } from "./enums";

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface IUser {
  _id: Types.ObjectId;
  clerkId: string;
  name: string;
  email?: string;
  profileImage: string;
  address: string;
  location: ILocation;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
