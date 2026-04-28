import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.types";
import { UserRole } from "../types/enums";

const LocationSchema = new Schema(
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
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    profileImage: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: LocationSchema,
      required: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FARMER,
    },
    fcmTokens: [
      {
        token: String,
        device: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Create geospatial index for location-based queries
UserSchema.index(
  { location: "2dsphere" },
  { partialFilterExpression: { location: { $exists: true } } },
);

export const User = mongoose.model<IUser>("User", UserSchema);
