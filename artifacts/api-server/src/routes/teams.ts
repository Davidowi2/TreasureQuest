import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { teamsTable, teamMembersTable, teamProgressTable, huntsTable, cluesTable, clueAttemptsTable } from "@workspace/db/schema";
import { authMiddleware } from "../lib/auth";
import { generateInviteCode, shuffleArray } from "../lib/utils";
import { io } from "../app";
import { z } from "zod";

const router = Router();

// Create team (player only)
const createTeamSchema = z.object({
  huntId: z.string(),
  name: z.string(),
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { huntId, name } = createTeamSchema.parse(req.body);

    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, huntId),
      with: { clues: true },
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }

    const inviteCode = generateInviteCode();

    // Create team
    const [team] = await db.insert(teamsTable).values({
      huntId,
      name,
      inviteCode,
      leaderId: req.user!.id,
    }).returning();

    // Add creator as leader
    await db.insert(teamMembersTable).values({
      teamId: team.id,
      userId: req.user!.id,
      teamRole: "leader",
      isActive: true,
    });

    // Get clue IDs in order
    let clueIds = hunt.clues
      .sort((a, b) => a.defaultOrder - b.defaultOrder)
      .map(c => c.id);

    // Shuffle if needed
    if (hunt.isShuffled) {
      clueIds = shuffleArray(clueIds);
    }

    // Create progress record
    await db.insert(teamProgressTable).values({
      teamId: team.id,
      clueSequence: clueIds,
      currentStep: 0,
      status: "paused",
    });

    // Create clue attempt records
    for (const clueId of clueIds) {
      await db.insert(clueAttemptsTable).values({
        teamId: team.id,
        clueId,
        attemptsCount: 0,
      });
    }

    res.status(201).json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Join team (player only)
const joinTeamSchema = z.object({
  inviteCode: z.string(),
});

router.post("/join", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { inviteCode } = joinTeamSchema.parse(req.body);

    const team = await db.query.teamsTable.findFirst({
      where: eq(teamsTable.inviteCode, inviteCode),
      with: { progress: true },
    });

    if (!team) {
      return res.status(404).json({ error: "Invalid invite code" });
    }
    if (team.progress?.status === "active" || team.progress?.status === "completed") {
      return res.status(400).json({ error: "Game already started" });
    }

    // Check if already in team
    const existingMember = await db.query.teamMembersTable.findFirst({
      where: and(
        eq(teamMembersTable.teamId, team.id),
        eq(teamMembersTable.userId, req.user!.id)
      ),
    });
    if (existingMember) {
      return res.status(400).json({ error: "Already in team" });
    }

    // Add to team
    const [member] = await db.insert(teamMembersTable).values({
      teamId: team.id,
      userId: req.user!.id,
      teamRole: "member",
      isActive: true,
    }).returning();

    // Emit socket event
    io.to(`team:${team.id}`).emit("member_joined", { userId: req.user!.id });

    res.status(201).json({ team, member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get team lobby
router.get("/:id/lobby", authMiddleware, async (req: Request, res: Response) => {
  try {
    const team = await db.query.teamsTable.findFirst({
      where: eq(teamsTable.id, req.params.id),
      with: {
        hunt: true,
        members: { with: { user: true } },
        progress: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user is member
    const isMember = team.members.some(m => m.userId === req.user?.id);
    if (!isMember) {
      return res.status(403).json({ error: "Not a team member" });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start game (leader only)
router.post("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const team = await db.query.teamsTable.findFirst({
      where: eq(teamsTable.id, req.params.id),
      with: { members: true, progress: true },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (team.leaderId !== req.user?.id) {
      return res.status(403).json({ error: "Only leader can start" });
    }
    if (team.progress?.status === "active" || team.progress?.status === "completed") {
      return res.status(400).json({ error: "Game already started/completed" });
    }

    const now = new Date();

    await db.update(teamsTable)
      .set({ startedAt: now })
      .where(eq(teamsTable.id, req.params.id));

    const [progress] = await db.update(teamProgressTable)
      .set({ status: "active", startedAt: now })
      .where(eq(teamProgressTable.teamId, req.params.id))
      .returning();

    res.json({ team, progress });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove member (leader only, before game starts)
router.delete("/:teamId/members/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const team = await db.query.teamsTable.findFirst({
      where: eq(teamsTable.id, req.params.teamId),
      with: { progress: true },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (team.leaderId !== req.user?.id) {
      return res.status(403).json({ error: "Only leader can remove members" });
    }
    if (team.progress?.status === "active" || team.progress?.status === "completed") {
      return res.status(400).json({ error: "Cannot remove members after game starts" });
    }

    await db.delete(teamMembersTable)
      .where(and(
        eq(teamMembersTable.teamId, req.params.teamId),
        eq(teamMembersTable.userId, req.params.userId)
      ));

    io.to(`team:${req.params.teamId}`).emit("member_disconnected", { userId: req.params.userId });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
