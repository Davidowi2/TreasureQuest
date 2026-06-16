import { Router, Request, Response } from "express";
import { db, teamsTable, teamMembersTable, huntsTable, teamProgressTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";
import { io } from "../app";

const router = Router();

// Create team
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { huntId, name } = req.body as any;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [team] = await db.insert(teamsTable).values({
      huntId,
      name,
      inviteCode,
      leaderId: req.user?.id || "",
    } as any).returning();

    // Also create initial team member as leader
    await db.insert(teamMembersTable).values({
      teamId: team.id,
      userId: req.user?.id || "",
      teamRole: "leader",
    });

    // And create initial team progress
    await db.insert(teamProgressTable).values({
      teamId: team.id,
      currentStep: 0,
      status: "paused",
    });

    res.status(201).json(team);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Join team
router.post("/join", authMiddleware, async (req: Request, res: Response) => {
  try {
    const inviteCode = req.body.invite_code as string | undefined;
    const huntId = req.body.hunt_id as string | undefined;

    if (!inviteCode && !huntId) {
      return res.status(400).json({ error: "Either invite_code or hunt_id is required" });
    }

    let team;

    if (inviteCode) {
      // Join by invite code (existing team)
      team = await (db.query.teamsTable as any).findFirst({
        where: (t: any, { eq }: any) => eq(t.inviteCode, inviteCode),
      });
    } else if (huntId) {
      // Join public hunt (create new team if none, or find?)
      const hunt = await (db.query.huntsTable as any).findFirst({
        where: (h: any, { eq }: any) => eq(h.id, huntId),
      });
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      if (!hunt.isPublic) {
        return res.status(403).json({ error: "This hunt is not public, you need an invite code" });
      }
      // Create new team for this public hunt
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [newTeam] = await (db as any).insert(teamsTable).values({
        huntId: hunt.id,
        name: `Public Team ${Math.floor(Math.random() * 1000)}`,
        inviteCode: newInviteCode,
        leaderId: req.user?.id || "",
      }).returning();
      team = newTeam;

      // Create initial team member and progress for new team
      await (db as any).insert(teamMembersTable).values({
        teamId: team.id,
        userId: req.user?.id || "",
        teamRole: "leader",
      });
      await (db as any).insert(teamProgressTable).values({
        teamId: team.id,
        currentStep: 0,
        status: "paused",
      });
    }

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Add user to team if not already there
    const existingMember = await (db.query.teamMembersTable as any).findFirst({
      where: (tm: any, { and, eq }: any) => and(eq(tm.teamId, team.id), eq(tm.userId, req.user?.id || "")),
    });
    if (!existingMember) {
      await (db as any).insert(teamMembersTable).values({
        teamId: team.id,
        userId: req.user?.id || "",
        teamRole: "member",
      });
    }

    return res.json(team);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get team QR code
router.get("/:teamId/qr", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const team = await (db.query.teamsTable as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, teamId),
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const qrUrl = `https://treasure-quest-lake.vercel.app/join?code=${team.inviteCode}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    return res.json({ qr_code: qrDataUrl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get team lobby
router.get("/:id/lobby", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id as string;
    // Get team
    const team = await (db.query.teamsTable as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, teamId),
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Verify user is a member of the team
    const member = await (db.query.teamMembersTable as any).findFirst({
      where: (tm: any, { and, eq }: any) =>
        and(eq(tm.teamId, teamId), eq(tm.userId, req.user?.id)),
    });
    if (!member) {
      return res.status(403).json({ error: "Not a member of this team" });
    }

    // Get all team members
    const members = await (db.query.teamMembersTable as any).findMany({
      where: (tm: any, { eq }: any) => eq(tm.teamId, teamId),
    });

    // Get team progress
    const progress = await (db.query.teamProgressTable as any).findFirst({
      where: (p: any, { eq }: any) => eq(p.teamId, teamId),
    });

    return res.json({
      team,
      members,
      progress,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Start game
router.post("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id as string;
    // Get team
    const team = await (db.query.teamsTable as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, teamId),
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Verify requester is leader
    if (team.leaderId !== req.user?.id) {
      return res.status(403).json({ error: "Only team leader can start the game" });
    }

    // Get team progress
    const progress = await (db.query.teamProgressTable as any).findFirst({
      where: (p: any, { eq }: any) => eq(p.teamId, teamId),
    });
    if (!progress) {
      return res.status(404).json({ error: "Team progress not found" });
    }

    // Update progress status to active and set started_at
    const [updatedProgress] = await (db as any).update(teamProgressTable)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(teamProgressTable.id as any, progress.id))
      .returning();

    // Emit Socket.io event
    io.to(`team:${teamId}`).emit("game_started");

    return res.json(updatedProgress);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Remove member
router.delete("/:teamId/members/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const userId = req.params.userId as string;

    // Get team
    const team = await (db.query.teamsTable as any).findFirst({
      where: (t: any, { eq }: any) => eq(t.id, teamId),
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Verify requester is leader
    if (team.leaderId !== req.user?.id) {
      return res.status(403).json({ error: "Only team leader can remove members" });
    }

    // Get team progress to check game hasn't started
    const progress = await (db.query.teamProgressTable as any).findFirst({
      where: (p: any, { eq }: any) => eq(p.teamId, teamId),
    });
    if (!progress) {
      return res.status(404).json({ error: "Team progress not found" });
    }
    if (progress.status === "active" || progress.status === "completed") {
      return res.status(403).json({ error: "Cannot remove members after game has started" });
    }

    // Delete the member
    await (db as any).delete(teamMembersTable).where(and(
      eq(teamMembersTable.teamId as any, teamId),
      eq(teamMembersTable.userId as any, userId)
    ));

    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
