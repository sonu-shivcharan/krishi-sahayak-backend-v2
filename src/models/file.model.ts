import mongoose, { Schema } from "mongoose";
import { IFile } from "../types/file.types";
import { FileType } from "../types/enums";

const FileSchema = new Schema<IFile>(
  {
    url: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(FileType),
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Index for efficient querying
FileSchema.index({ uploadedBy: 1 });

export const File = mongoose.model<IFile>("File", FileSchema);
