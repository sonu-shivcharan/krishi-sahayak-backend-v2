import { Router } from "express";
import { forwardQuery } from "../controllers/forwardedQueries.controller";
import { verifyClerkToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/forward", verifyClerkToken, forwardQuery);

export default router;
