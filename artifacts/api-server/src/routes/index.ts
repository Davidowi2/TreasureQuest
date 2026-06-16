import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import huntsRouter from "./hunts";
import cluesRouter from "./clues";
import teamsRouter from "./teams";
import gameRouter from "./game";
import adminRouter from "./admin";
import leaderboardRouter from "./leaderboard";

const router = Router();

router.use("/health", healthRouter);
router.use("/v1/auth", authRouter);
router.use("/v1/hunts", huntsRouter);
router.use("/v1/clues", cluesRouter);
router.use("/v1/teams", teamsRouter);
router.use("/v1/game", gameRouter);
router.use("/v1/admin", adminRouter);
router.use("/v1/leaderboards", leaderboardRouter);

export default router;
