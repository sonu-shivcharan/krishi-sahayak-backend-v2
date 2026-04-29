import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { RegisterUserInput } from "../validations/user.validation";
import { User as ClerkUser } from "@clerk/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";

/**
 * Register/Create a new user in MongoDB after Clerk authentication
 * This endpoint syncs Clerk user data with your MongoDB database
 * Validation is handled by validate middleware
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, profileImage, address, location, role } =
    req.body as RegisterUserInput;

  const { emailAddresses, id: clerkId } = req.clerkUser as ClerkUser;
  const email = emailAddresses[0].emailAddress;

  // Check if user already exists
  const existingUser = await User.findOne({ clerkId });
  if (existingUser) {
    throw new ApiError(409, "User already registered");
  }

  // Create new user
  const newUser = new User({
    clerkId,
    name,
    email,
    profileImage,
    address,
    location,
    role,
  });

  try {
    await newUser.save();
  } catch (error: any) {
    if (error.code === 11000) {
      const field = error.keyPattern?.email ? "email" : "clerkId";
      throw new ApiError(409, `User with this ${field} already exists`);
    }
    throw new ApiError(500, "Failed to register user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User registered successfully"));
});

/**
 * Get current user info (after Clerk authentication)
 * Requires authentication middleware
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const clerkId = req.clerkUser?.id;

    if (!clerkId) {
      throw new ApiError(401, "Unauthorized: User ID not found");
    }

    const user = await User.findOne({ clerkId }).select("-__v");

    if (!user) {
      throw new ApiError(404, "User not found. Please register first.");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User retrieved successfully"));
  },
);

/**
 * Update user profile
 * Requires authentication middleware
 * Validation is handled by validate middleware
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const clerkId = req.userId;

  if (!clerkId) {
    throw new ApiError(401, "Unauthorized: User ID not found");
  }

  const { name, email, profileImage, address, location, role } = req.body;

  const user = await User.findOne({ clerkId });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update only provided fields
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (address !== undefined) user.address = address;
  if (location !== undefined) {
    user.location = location;
  }
  if (role !== undefined) {
    user.role = role;
  }

  try {
    await user.save();
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(409, "User with this email already exists");
    }
    throw new ApiError(500, "Failed to update user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

// officer only
/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  let user;
  try {
    user = await User.findById(userId).select("-__v");
  } catch (error: any) {
    if (error.name === "CastError") {
      throw new ApiError(400, "Invalid user ID format");
    }
    throw error;
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User retrieved successfully"));
});

export const saveFCMToken = asyncHandler(async (req, res) => {
  const fcmToken = req.body.fcmToken;
  const device = req.body.device || "unknown";
  const userId = req.user._id;

  if (!fcmToken?.trim()) {
    throw new ApiError(400, "FCM token is required");
  }
  await User.findByIdAndUpdate(userId, {
    $pull: { fcmTokens: { device } },
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      fcmTokens: {
        token: fcmToken,
        device,
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "FCM token saved successfully"));
});
