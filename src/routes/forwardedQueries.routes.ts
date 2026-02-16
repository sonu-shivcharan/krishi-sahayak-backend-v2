import { Router } from "express";
import {
  forwardQuery,
  getMyForwardedQueries,
  getOfficerForwardedQueries,
} from "../controllers/forwardedQueries.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import { UserRole } from "../types/enums";

const router = Router();

// Forward a conversation query to nearby officers
router.post("/forward", verifyUser(), forwardQuery);

// Get all queries forwarded by the logged-in user (Farmer)
router.get("/me", verifyUser(), getMyForwardedQueries);


// officer only routes
// Get all queries forwarded to the logged-in officer
router.get(
  "/",
  verifyUser({ requiredRole: UserRole.OFFICER }),
  getOfficerForwardedQueries,
);

export default router;
