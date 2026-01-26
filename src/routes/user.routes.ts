import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
  getUserById,
  updateUser,
} from "../controllers/user.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  registerUserSchema,
  updateUserSchema,
} from "../validations/user.validation";

const router = Router();

router.post(
  "/register",
  validate(registerUserSchema),
  verifyClerkToken,
  registerUser,
);

// Protected routes (require authentication)
router.get("/me", verifyClerkToken, getCurrentUser);
router.get("/:userId", getUserById);
router.patch("/me", verifyClerkToken, validate(updateUserSchema), updateUser);

export default router;
