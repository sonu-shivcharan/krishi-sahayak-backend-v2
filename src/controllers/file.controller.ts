import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import fileService from "../services/file.service";
import { FileType } from "../types/enums";

const uploadFile = asyncHandler(async (req, res) => {
  const file = req.file;
  console.log("Uploaded file object:", file);

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  // Determine file type from mimetype
  let fileType: FileType = FileType.IMAGE;
  if (file.mimetype === "application/pdf") {
    fileType = FileType.PDF;
  } else if (file.mimetype.startsWith("video/")) {
    fileType = FileType.VIDEO;
  } else if (file.mimetype.startsWith("image/")) {
    fileType = FileType.IMAGE;
  }

  // Use the MongoDB ID from req.user set by auth middleware
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(401, "User authentication required to upload files");
  }

  const uploadedFile = await fileService.uploadFile({
    url: (file as any).path, // Cloudinary publicly readable URL
    path: (file as any).filename, // Cloudinary public_id
    type: fileType,
    uploadedBy: userId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        uploadedFile,
        "File uploaded successfully and ingestion started"
      )
    );
});

export { uploadFile };
