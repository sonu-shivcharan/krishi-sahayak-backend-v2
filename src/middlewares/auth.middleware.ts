import {
  clerkClient,
  getAuth,
  requireAuth,
  User as clerkUser,
} from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { User } from "../models";
import { IUser } from "../types/user.types";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Clerk user ID (set by middleware)
      clerkUser?: clerkUser;
      user: IUser;
    }
  }
}

export const verifyClerkToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = getAuth(req);
    console.log("userId", userId);
    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }
    const clerkUser = await clerkClient.users.getUser(userId);
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new ApiError(404, "User not found. Please register first.");
    }
    // Set userId on request for convenient access in controller
    req.clerkUser = clerkUser;
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        success: false,
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(401).json({
      statusCode: 401,
      message: "Unauthorized: Invalid token",
      errors: [],
      success: false,
    });
  }
};

/**
 * Re-export Clerk's requireAuth() for direct use
 * This is the official Clerk middleware - use it like:
 * router.get("/route", requireAuth(), controller);
 */
export { requireAuth };

/**
 * Optional middleware - makes authentication optional
 * Sets req.userId if user is authenticated, but doesn't fail if missing
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = getAuth(req);

    if (userId) {
      req.userId = userId;
    }

    next();
  } catch (error) {
    // Continue even if auth fails in optional mode
    next();
  }
};
