import { Router } from "express";
import {
  forwardQuery,
  getForwardedQueriesForOfficer,
} from "../controllers/forwardedQueries.controller";
import { verifyClerkToken, verifyUser } from "../middlewares/auth.middleware";
import { UserRole } from "../types/enums";

const router = Router();

router.post("/forward", verifyClerkToken, forwardQuery);
router.get(
  "/",
  verifyUser({ requiredRole: UserRole.OFFICER }),
  getForwardedQueriesForOfficer,
);
export default router;
