import { Request, Response, NextFunction } from "express";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Clerk user ID
      user?: any; // Full user object from Clerk
    }
  }
}

/**
 * Middleware to verify Clerk authentication token
 * This is a placeholder - you'll need to install @clerk/clerk-sdk-node
 * and implement proper token verification
 */
export const verifyClerkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // TODO: Verify token with Clerk SDK
    // Example implementation (requires @clerk/clerk-sdk-node):
    // const clerkClient = clerkClient();
    // const decoded = await clerkClient.verifyToken(token);
    // req.userId = decoded.sub; // Clerk user ID
    // req.user = decoded;

    // For now, we'll extract userId from token (temporary solution)
    // In production, use Clerk SDK to verify the token properly
    if (process.env.NODE_ENV === "development") {
      // Development mode: accept token as-is (not secure, for testing only)
      req.userId = token;
    } else {
      return res.status(401).json({ error: "Token verification not implemented. Please install @clerk/clerk-sdk-node" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

/**
 * Optional middleware - makes authentication optional
 * Sets req.userId if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // TODO: Verify token with Clerk SDK
      if (process.env.NODE_ENV === "development") {
        req.userId = token;
      }
    }

    next();
  } catch (error) {
    // Continue even if auth fails in optional mode
    next();
  }
};
