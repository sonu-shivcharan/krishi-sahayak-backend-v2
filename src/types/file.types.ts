
import { Types } from "mongoose";
import { FileType } from "./enums";

export interface IFile {
  _id: Types.ObjectId;
  url: string;
  path: string; // storage path / key for delete
  type: FileType;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}
