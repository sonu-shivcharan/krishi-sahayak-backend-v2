import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { RegisterUserInput } from "../validations/user.validation";
import { User as ClerkUser } from "@clerk/express";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Register/Create a new user in MongoDB after Clerk authentication
 * This endpoint syncs Clerk user data with your MongoDB database
 * Validation is handled by validate middleware
 */
export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, profileImage, address, location } =
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
    });

    await newUser.save();

    res.status(201).json({
      statusCode: 201,
      message: "User registered successfully",
      data: newUser,
      success: true,
    });
  } catch (error: any) {
    console.error("Register user error:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        success: false,
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (clerkId or email already exists)
      const field = error.keyPattern?.email ? "email" : "clerkId";
      return res.status(409).json({
        statusCode: 409,
        message: `User with this ${field} already exists`,
        errors: [],
        success: false,
      });
    }

    res.status(500).json({
      statusCode: 500,
      message: "Failed to register user",
      errors: [],
      success: false,
    });
  }
});

/**
 * Get current user info (after Clerk authentication)
 * Requires authentication middleware
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const clerkId = req.userId;

    if (!clerkId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    const user = await User.findOne({ clerkId }).select("-__v");

    if (!user) {
      return res.status(404).json({
        error: "User not found. Please register first.",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "User retrieved successfully",
      data: user,
      success: true,
    });
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Failed to get user",
      errors: [],
      success: false,
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-__v");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "User retrieved successfully",
      data: user,
      success: true,
    });
  } catch (error: any) {
    console.error("Get user by ID error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid user ID format",
        errors: [],
        success: false,
      });
    }

    res.status(500).json({
      statusCode: 500,
      message: "Failed to get user",
      errors: [],
      success: false,
    });
  }
};

/**
 * Update user profile
 * Requires authentication middleware
 * Validation is handled by validate middleware
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const clerkId = req.userId;

    if (!clerkId) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized: User ID not found",
        errors: [],
        success: false,
      });
    }

    const { name, email, profileImage, address, location, role } = req.body;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        errors: [],
        success: false,
      });
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

    await user.save();

    res.status(200).json({
      statusCode: 200,
      message: "User updated successfully",
      data: user,
      success: true,
    });
  } catch (error: any) {
    console.error("Update user error:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        success: false,
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      return res.status(409).json({
        statusCode: 409,
        message: "User with this email already exists",
        errors: [],
        success: false,
      });
    }

    res.status(500).json({
      statusCode: 500,
      message: "Failed to update user",
      errors: [],
      success: false,
    });
  }
};
