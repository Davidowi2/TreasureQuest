import { Router, Request, Response } from "express";
import { db, teamsTable, teamProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get leaderboard for a hunt
router.get("/:huntId", async (req: Request, res: Response) => {
  try {
    const huntId = req.params.huntId as string;

    if (!huntId) {
      return res.status(400).json({ error: "huntId is required" });
    }

    // Fetch all teams with progress for the hunt
    const teams = await db.query.teamsTable.findMany({
      where: (t, { eq }) => eq(t.huntId, huntId),
      with: {
        progress: true,
      },
    });

    // Filter out teams still in lobby (status: paused)
    const eligibleTeams = teams.filter(team => 
      team.progress && (team.progress.status === "active" || team.progress.status === "completed")
    );

    // Calculate duration and prepare for sorting
    const now = new Date();
    const teamsWithStats = eligibleTeams.map(team => {
      const progress = team.progress!;
      let durationSeconds = 0;
      let hasFinished = false;

      if (progress.status === "completed" && progress.completedAt && progress.startedAt) {
        hasFinished = true;
        durationSeconds = Math.floor(
          (new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()) / 1000
        );
      } else if (progress.status === "active" && progress.startedAt) {
        durationSeconds = Math.floor(
          (now.getTime() - new Date(progress.startedAt).getTime()) / 1000
        );
      }

      return {
        id: team.id,
        teamName: team.name,
        gameStatus: progress.status,
        currentStep: progress.currentStep,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        durationSeconds,
        hasFinished,
      };
    });

    // Sort teams
    const sortedTeams = [...teamsWithStats].sort((a, b) => {
      // Completed teams come first
      if (a.hasFinished && !b.hasFinished) return -1;
      if (!a.hasFinished && b.hasFinished) return 1;

      // Both completed: sort by duration ascending
      if (a.hasFinished && b.hasFinished) {
        return a.durationSeconds - b.durationSeconds;
      }

      // Both active: sort by currentStep descending first
      if (a.currentStep !== b.currentStep) {
        return b.currentStep - a.currentStep;
      }

      // Same step: sort by duration ascending (faster first)
      return a.durationSeconds - b.durationSeconds;
    });

    // Add rank
    const rankedTeams = sortedTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    return res.json({ leaderboard: rankedTeams });
  } catch (e) {
    console.error("Leaderboard error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
