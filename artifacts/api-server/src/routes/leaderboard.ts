import { Router, Request, Response } from "express";
import { db, teamsTable, teamProgressTable, huntsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Get leaderboard for a hunt
router.get("/:huntId", async (req: Request, res: Response) => {
  try {
    const huntId = req.params.huntId as string;

    if (!huntId) {
      return res.status(400).json({ error: "huntId is required" });
    }

    // First fetch the hunt to get totalClues
    const hunt = await db.query.huntsTable.findFirst({
      where: (h, { eq }) => eq(h.id, huntId),
      with: {
        clues: true,
      },
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }

    const totalClues = (hunt.clues as any[]).length;

    // Fetch all teams with progress for the hunt using explicit join
    const teamsWithProgress = await db
      .select()
      .from(teamsTable)
      .innerJoin(teamProgressTable, eq(teamsTable.id, teamProgressTable.teamId))
      .where(eq(teamsTable.huntId, huntId));

    // Filter out teams still in lobby (status: paused)
    const eligibleTeams = teamsWithProgress.filter(row => 
      (row.team_progress as any).status === "active" || (row.team_progress as any).status === "completed"
    );

    // Prepare for sorting
    const teamsWithStats = eligibleTeams.map(row => {
      const team = row.teams;
      const progress = row.team_progress as any;
      const cluesFound = progress.currentStep;
      const lastActiveTime = progress.ts; // Use ts as last clue solved at or last active

      return {
        id: team.id,
        teamName: team.name,
        gameStatus: progress.status,
        cluesFound,
        totalClues,
        lastActiveTime,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
      };
    });

    // Sort teams: first by cluesFound descending, then by lastActiveTime ascending
    const sortedTeams = [...teamsWithStats].sort((a, b) => {
      // First sort by clues found (descending)
      if (a.cluesFound !== b.cluesFound) {
        return b.cluesFound - a.cluesFound;
      }
      // Tie-breaker: last active time (ascending: whoever solved that clue first wins)
      const aTime = a.lastActiveTime ? new Date(a.lastActiveTime).getTime() : 0;
      const bTime = b.lastActiveTime ? new Date(b.lastActiveTime).getTime() : 0;
      return aTime - bTime;
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
