import { z } from "zod";
import { UserRole } from "../types/enums";

// Location schema
const locationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .refine(
      (coords) => coords.length === 2,
      "Coordinates must be [longitude, latitude]",
    ),
});

// User registration schema
export const registerUserSchema = z.object({
  body: z.object({
    // clerkId: z.string().min(1, "Clerk ID is required"),
    name: z.string().min(1, "Name is required").trim(),
    profileImage: z.url("Invalid profile image URL").optional(),
    address: z.string().min(1, "Address is required").trim(),
    location: locationSchema.optional(),
    // role: z.enum(UserRole, {
    //   message: `Role must be one of: ${Object.values(UserRole).join(", ")}`,
    // }),
  }),
});

// User update schema (all fields optional except validation)
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").trim().optional(),
    email: z.email("Invalid email format").toLowerCase().trim().optional(),
    profileImage: z.url("Invalid profile image URL").optional(),
    address: z.string().min(1, "Address cannot be empty").trim().optional(),
    location: locationSchema.optional(),
    role: z
      .enum(UserRole, {
        message: `Role must be one of: ${Object.values(UserRole).join(", ")}`,
      })
      .optional(),
  }),
});

// Export types for TypeScript inference
export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
