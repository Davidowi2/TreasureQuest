import { Router, Request, Response } from "express";
import { authMiddleware } from "../lib/auth";
import { db, huntsTable, teamsTable, teamProgressTable, cluesTable, clueAttemptsTable } from "@workspace/db";
import { eq, and, asc, gt } from "drizzle-orm";
import { io } from "../app";

const router = Router();

// 1. GET /hunts/:huntId/overview
router.get("/hunts/:huntId/overview", authMiddleware, async (req: Request, res: Response) => {
  try {
    const huntId = req.params.huntId as string;

    // 1.1 Verify the hunt exists
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, huntId),
    });
    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }

    // 1.2 Get all teams and their progress for the hunt
    const teams = await db.query.teamsTable.findMany({
      where: eq(teamsTable.huntId, huntId),
      with: {
        progress: true,
      },
    });

    // 1.3 Calculate counts by game status
    const statusCounts = {
      lobby: 0,
      active: 0,
      completed: 0,
    };
    // 1.4 Calculate stuck teams by clue
    const stuckClues: Record<string, number> = {};

    // Get all clues for the hunt to get defaultOrder
    const clues = await db.query.cluesTable.findMany({
      where: eq(cluesTable.huntId, huntId),
      orderBy: [asc(cluesTable.defaultOrder)],
    });

    teams.forEach((team: any) => {
    if (team.progress) {
      const status = team.progress.status as keyof typeof statusCounts;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === "active" && (team.progress as any).currentStep != null) {
        // Map currentStep to clueId (since currentStep is defaultOrder)
        const stuckClue = clues.find((c) => c.defaultOrder === (team.progress as any).currentStep);
        if (stuckClue) {
          stuckClues[stuckClue.id] = (stuckClues[stuckClue.id] || 0) + 1;
        }
      }
    }
  });

    return res.json({
      totalTeams: teams.length,
      statusCounts,
      stuckClues,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// 2. POST /teams/:teamId/force-advance
router.post("/teams/:teamId/force-advance", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const { markAsCompleted } = req.body as { markAsCompleted?: boolean };

    // 2.1 Get team and progress
    const team = await db.query.teamsTable.findFirst({
      where: eq(teamsTable.id, teamId),
      with: { progress: true },
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.progress) {
      return res.status(400).json({ error: "Team progress not found" });
    }

    // 2.2 Get all clues for hunt
    const clues = await db.query.cluesTable.findMany({
      where: eq(cluesTable.huntId, team.huntId),
      orderBy: [asc(cluesTable.defaultOrder)],
    });

    if (markAsCompleted) {
      // Mark as completed
      await db.update(teamProgressTable)
        .set({
          status: "completed",
          completedAt: new Date(),
        } as any)
        .where(eq(teamProgressTable.teamId, teamId));
    } else {
      // Advance to next clue
      const nextClueIndex = (team.progress as any).currentStep + 1;
      if (nextClueIndex >= clues.length) {
        await db.update(teamProgressTable)
          .set({
            status: "completed",
            completedAt: new Date(),
          } as any)
          .where(eq(teamProgressTable.teamId, teamId));
      } else {
        await db.update(teamProgressTable)
          .set({ currentStep: nextClueIndex } as any)
          .where(eq(teamProgressTable.teamId, teamId));
      }
    }

    // Emit to team room
    io.to(`team:${teamId}`).emit("clue_result", {
      status: "success",
      teamId,
      message: "Team was force-advanced by admin",
    });

    // Emit to admin_global
    const currentStep = (team.progress as any).currentStep;
    const currentClue = clues.find((c) => c.defaultOrder === currentStep);
    io.to("admin_global").emit("admin_stream_update", {
      timestamp: new Date().toISOString(),
      teamName: team.name,
      huntId: team.huntId,
      clueTitle: currentClue?.hintText || "Unknown",
      attemptStatus: "forced_advance",
      type: "admin",
    });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
