import { Router } from "express";
import {
  registerUser,
  getCurrentUser,
  getUserById,
  updateUser,
} from "../controllers/user.controller";
import {
  verifyClerkToken,
  verifyClerkTokenForRegistration,
  verifyUser,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  registerUserSchema,
  updateUserSchema,
} from "../validations/user.validation";
import { UserRole } from "../types/enums";

const router = Router();

router.post(
  "/register",
  validate(registerUserSchema),
  verifyClerkTokenForRegistration,
  registerUser,
);

// Protected routes (require authentication)
router.get("/me", verifyClerkToken, getCurrentUser);
router.patch("/me", verifyClerkToken, validate(updateUserSchema), updateUser);

router.get("/:userId",verifyUser({requiredRole:UserRole.OFFICER}), getUserById);
export default router;
