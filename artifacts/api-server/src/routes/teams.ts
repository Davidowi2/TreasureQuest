import { Router, Request, Response } from "express";
import { db, teamsTable, teamMembersTable, huntsTable, teamProgressTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";

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
    const { invite_code: inviteCode, hunt_id: huntId } = req.body;

    if (!inviteCode && !huntId) {
      return res.status(400).json({ error: "Either invite_code or hunt_id is required" });
    }

    let team;

    if (inviteCode) {
      // Join by invite code (existing team)
      team = await db.query.teamsTable.findFirst({
        where: (t, { eq }) => eq(t.inviteCode, inviteCode),
      });
    } else if (huntId) {
      // Join public hunt (create new team if none, or find?)
      const hunt = await db.query.huntsTable.findFirst({
        where: (h, { eq }) => eq(h.id, huntId),
      });
      if (!hunt) {
        return res.status(404).json({ error: "Hunt not found" });
      }
      if (!hunt.isPublic) {
        return res.status(403).json({ error: "This hunt is not public, you need an invite code" });
      }
      // Create new team for this public hunt
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [newTeam] = await db.insert(teamsTable).values({
        huntId: hunt.id,
        name: `Public Team ${Math.floor(Math.random() * 1000)}`,
        inviteCode: newInviteCode,
        leaderId: req.user?.id || "",
      }).returning();
      team = newTeam;

      // Create initial team member and progress for new team
      await db.insert(teamMembersTable).values({
        teamId: team.id,
        userId: req.user?.id || "",
        teamRole: "leader",
      });
      await db.insert(teamProgressTable).values({
        teamId: team.id,
        currentStep: 0,
        status: "paused",
      });
    }

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Add user to team if not already there
    const existingMember = await db.query.teamMembersTable.findFirst({
      where: (tm, { and, eq }) => and(eq(tm.teamId, team.id), eq(tm.userId, req.user?.id || "")),
    });
    if (!existingMember) {
      await db.insert(teamMembersTable).values({
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
    const { teamId } = req.params;
    const team = await db.query.teamsTable.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const qrUrl = `https://treasure-quest-lake.vercel.app/join?code=${team.inviteCode}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    res.json({ qr_code: qrDataUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
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
