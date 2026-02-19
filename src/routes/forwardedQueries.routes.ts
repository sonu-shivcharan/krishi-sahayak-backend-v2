import { Router } from "express";
import {
  answerForwardedQuery,
  forwardQuery,
  getForwaredQuery,
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

router.get(
  "/:forwardedQueryId",
  verifyUser({ requiredRole: UserRole.OFFICER }),
  getForwaredQuery,
);

router.patch(
  "/:forwardedQueryId/answer",
  verifyUser({ requiredRole: UserRole.OFFICER }),
  answerForwardedQuery,
);

// router.patch(
//   "/:forwardedQueryId/ai-suggestion",
//   verifyUser({ requiredRole: UserRole.OFFICER }),
//   answerForwardedQuery,
// );

export default router;
