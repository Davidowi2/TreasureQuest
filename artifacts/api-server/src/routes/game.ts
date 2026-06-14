import { Router, Request, Response } from "express";
import { authMiddleware } from "../lib/auth";

const router = Router();

// Get current clue
router.get("/:teamId/active-clue", authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ progress: null, clue: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify clue
router.post("/:teamId/verify", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Placeholder implementation
    res.json({ correct: false, progress: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
