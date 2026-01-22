import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
  getUserById,
  updateUser,
} from "../controllers/user.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/register", registerUser);

// Protected routes (require authentication)
router.get("/me", verifyClerkToken, getCurrentUser);
router.get("/:userId", getUserById);
router.patch("/me", verifyClerkToken, updateUser);

export default router;
