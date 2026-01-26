import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Generic validation middleware factory
 * Validates request data against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          statusCode: 400,
          message: "Validation failed",
          errors,
          success: false,
        });
      }

      // If it's not a ZodError, pass it to the error handler
      next(error);
    }
  };
};
