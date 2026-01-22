import { Request, Response } from "express";
import { User } from "../models/user.model";
import { UserRole } from "../types/enums";

/**
 * Register/Create a new user in MongoDB after Clerk authentication
 * This endpoint syncs Clerk user data with your MongoDB database
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, name, email, profile, address, location, role } = req.body;

    // Validation
    if (!clerkId || !name || !profile || !address || !location || !role) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["clerkId", "name", "profile", "address", "location", "role"],
      });
    }

    // Validate location format
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        error: "Invalid location format. Expected: { type: 'Point', coordinates: [lng, lat] }",
      });
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      // Update existing user
      existingUser.name = name;
      existingUser.email = email || existingUser.email;
      existingUser.profile = profile;
      existingUser.address = address;
      existingUser.location = location;
      existingUser.role = role;
      await existingUser.save();

      return res.status(200).json({
        message: "User updated successfully",
        user: existingUser,
      });
    }

    // Create new user
    const newUser = new User({
      clerkId,
      name,
      email,
      profile,
      address,
      location,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error: any) {
    console.error("Register user error:", error);

    if (error.code === 11000) {
      // Duplicate key error (clerkId already exists)
      return res.status(409).json({
        error: "User with this Clerk ID already exists",
      });
    }

    res.status(500).json({
      error: "Failed to register user",
      message: error.message,
    });
  }
};

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
      message: "User retrieved successfully",
      user,
    });
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Failed to get user",
      message: error.message,
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
      message: "User retrieved successfully",
      user,
    });
  } catch (error: any) {
    console.error("Get user by ID error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid user ID format",
      });
    }

    res.status(500).json({
      error: "Failed to get user",
      message: error.message,
    });
  }
};

/**
 * Update user profile
 * Requires authentication middleware
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const clerkId = req.userId;

    if (!clerkId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    const { name, email, profile, address, location, role } = req.body;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (profile !== undefined) user.profile = profile;
    if (address !== undefined) user.address = address;
    if (location !== undefined) {
      if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({
          error: "Invalid location format. Expected: { type: 'Point', coordinates: [lng, lat] }",
        });
      }
      user.location = location;
    }
    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`,
        });
      }
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Failed to update user",
      message: error.message,
    });
  }
};
