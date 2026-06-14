import { Router, Request, Response } from "express";
import { db, teamsTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router = Router();

// Create team
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { huntId, name } = req.body as any;
    const inviteCode = "INV1234";

    const [team] = await db.insert(teamsTable).values({
      huntId, name,
      leaderId: req.user?.id || "",
    } as any).returning();

    res.status(201).json(team);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Join team
router.post("/join", authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: "Join team placeholder" });
});

// Get team lobby
router.get("/:id/lobby", authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: "Team lobby placeholder" });
});

// Start game
router.post("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: "Start game placeholder" });
});

// Remove member
router.delete("/:teamId/members/:userId", authMiddleware, async (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
