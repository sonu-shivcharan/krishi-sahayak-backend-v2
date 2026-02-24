import { Router } from "express";
import multer from "multer";
import { storage } from "../config/cloudinary";
import { uploadFile } from "../controllers/file.controller";

import { verifyUser } from "../middlewares/auth.middleware";
import { UserRole } from "../types/enums";

const router = Router();
const upload = multer({ storage });

// POST /api/v1/files/upload
// Only allow officers to upload government schemes
router.post(
  "/upload",
  verifyUser({ requiredRole: UserRole.FARMER }),
  upload.single("file"),
  uploadFile
);

export default router;
