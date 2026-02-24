import { File } from "../models/file.model";
import { IFile } from "../types/file.types";
import { FileType } from "../types/enums";
import eventEmitter, { EVENTS } from "../utils/events";
import { Types } from "mongoose";

export class FileService {
  /**
   * Upload a file and save its metadata to the database.
   * After successful save, emits a FILE_UPLOADED event.
   */
  async uploadFile(fileData: {
    url: string;
    path: string;
    type: FileType;
    uploadedBy: string | Types.ObjectId;
  }): Promise<IFile> {
    let uploadedBy: Types.ObjectId;
    if (typeof fileData.uploadedBy === "string") {
      if (Types.ObjectId.isValid(fileData.uploadedBy)) {
        uploadedBy = new Types.ObjectId(fileData.uploadedBy);
      } else {
        throw new Error(`Invalid uploadedBy ID: ${fileData.uploadedBy}. Must be a valid MongoDB ObjectId.`);
      }
    } else {
      uploadedBy = fileData.uploadedBy;
    }

    const newFile = await File.create({
      url: fileData.url,
      path: fileData.path,
      type: fileData.type,
      uploadedBy,
    });

    // Emit event for ingestion
    eventEmitter.emit(EVENTS.FILE_UPLOADED, newFile);

    return newFile;
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<IFile | null> {
    return await File.findById(fileId);
  }
}

export default new FileService();
