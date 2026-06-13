import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { teamProgressTable, cluesTable, teamMembersTable, clueAttemptsTable, teamsTable } from "@workspace/db/schema";
import { authMiddleware } from "../lib/auth";
import { upload } from "../lib/multer";
import { uploadImage } from "../lib/cloudinary";
import { io } from "../app";
import { z } from "zod";

const router = Router();

// Helper: get user's active team
async function getUserTeam(userId: string) {
  const member = await db.query.teamMembersTable.findFirst({
    where: eq(teamMembersTable.userId, userId),
    with: { team: { with: { progress: true } } },
  });
  return member?.team;
}

// Get active clue
router.get("/active-clue", authMiddleware, async (req: Request, res: Response) => {
  try {
    const team = await getUserTeam(req.user!.id);
    if (!team) {
      return res.status(404).json({ error: "No active team" });
    }
    if (!team.progress) {
      return res.status(404).json({ error: "No game progress" });
    }
    if (team.progress.status !== "active") {
      return res.status(400).json({ error: "Game not active" });
    }

    const clueId = team.progress.clueSequence[team.progress.currentStep];
    const clue = await db.query.cluesTable.findFirst({
      where: eq(cluesTable.id, clueId),
    });
    if (!clue) {
      return res.status(404).json({ error: "Clue not found" });
    }

    // Return only necessary fields (no reference image)
    const { referenceImg, ...safeClue } = clue;

    // Get attempt count
    const attempt = await db.query.clueAttemptsTable.findFirst({
      where: and(
        eq(clueAttemptsTable.teamId, team.id),
        eq(clueAttemptsTable.clueId, clueId)
      ),
    });

    res.json({
      clue: safeClue,
      currentStep: team.progress.currentStep,
      totalSteps: team.progress.clueSequence.length,
      attemptsCount: attempt?.attemptsCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mock image verification function
const mockVerifyImage = async (): Promise<number> => {
  // Simple mock verification for now
  // In production, implement with Python/ML service
  return Math.random() > 0.5 ? 0.98 : 0.7;
};

// Verify step
router.post("/verify-step", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const team = await getUserTeam(req.user!.id);
    if (!team) {
      return res.status(404).json({ error: "No active team" });
    }
    if (!team.progress) {
      return res.status(404).json({ error: "No game progress" });
    }
    if (team.progress.status !== "active") {
      return res.status(400).json({ error: "Game not active" });
    }

    const clueId = team.progress.clueSequence[team.progress.currentStep];
    const clue = await db.query.cluesTable.findFirst({
      where: eq(cluesTable.id, clueId),
    });
    if (!clue) {
      return res.status(404).json({ error: "Clue not found" });
    }

    // Get current attempt record
    let attempt = await db.query.clueAttemptsTable.findFirst({
      where: and(
        eq(clueAttemptsTable.teamId, team.id),
        eq(clueAttemptsTable.clueId, clueId)
      ),
    });
    if (!attempt) {
      return res.status(500).json({ error: "Attempt record missing" });
    }

    const newAttemptsCount = attempt.attemptsCount + 1;

    // Increment attempts
    await db.update(clueAttemptsTable)
      .set({ attemptsCount: newAttemptsCount })
      .where(eq(clueAttemptsTable.id, attempt.id));

    // Mock verification (for now)
    const score = await mockVerifyImage();
    const isCorrect = score >= 0.97 || newAttemptsCount >= 3;

    const response: any = {
      success: isCorrect,
      score,
      attemptsCount: newAttemptsCount,
    };

    if (newAttemptsCount >= 3 && clue.hintUnlockText) {
      response.hintUnlockText = clue.hintUnlockText;
    }

    if (newAttemptsCount >= 5) {
      response.cooldown = true;
      response.cooldownUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    }

    if (isCorrect) {
      // Mark clue as solved
      await db.update(clueAttemptsTable)
        .set({ solvedAt: new Date() })
        .where(eq(clueAttemptsTable.id, attempt.id));

      // Emit socket event
      io.to(`team:${team.id}`).emit("clue_solved", {
        clueIndex: team.progress.currentStep,
      });

      const nextStep = team.progress.currentStep + 1;
      if (nextStep >= team.progress.clueSequence.length) {
        // Game complete
        const now = new Date();
        await db.update(teamProgressTable)
          .set({
            status: "completed",
            completedAt: now,
            currentStep: nextStep,
          })
          .where(eq(teamProgressTable.teamId, team.id));

        await db.update(teamsTable)
          .set({ completedAt: now })
          .where(eq(teamsTable.id, team.id));

        io.to(`team:${team.id}`).emit("game_completed");
        response.gameCompleted = true;
      } else {
        // Advance to next step
        await db.update(teamProgressTable)
          .set({ currentStep: nextStep })
          .where(eq(teamProgressTable.teamId, team.id));
        response.nextClueAvailable = true;
      }
    }

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
