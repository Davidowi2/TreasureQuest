import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { eq, and, like, or } from "drizzle-orm";
import { huntsTable, cluesTable, teamsTable, teamProgressTable } from "@workspace/db/schema";
import { authMiddleware } from "../lib/auth";
import { z } from "zod";

const router = Router();

// Create hunt (creator only)
const createHuntSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  locationTag: z.string(),
  isShuffled: z.boolean().optional().default(false),
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role === "player") {
      return res.status(403).json({ error: "Creators only" });
    }

    const data = createHuntSchema.parse(req.body);
    const [hunt] = await db.insert(huntsTable).values({
      ...data,
      creatorId: req.user!.id,
    }).returning();

    res.status(201).json(hunt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get published hunts (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    let query = db.query.huntsTable.findMany({
      where: eq(huntsTable.status, "published"),
      with: {
        creator: true,
      },
    });

    if (req.query.difficulty) {
      query = db.query.huntsTable.findMany({
        where: and(
          eq(huntsTable.status, "published"),
          eq(huntsTable.difficulty, req.query.difficulty as any)
        ),
        with: { creator: true },
      });
    }

    if (req.query.locationTag) {
      query = db.query.huntsTable.findMany({
        where: and(
          eq(huntsTable.status, "published"),
          eq(huntsTable.locationTag, req.query.locationTag as string)
        ),
        with: { creator: true },
      });
    }

    if (req.query.search) {
      query = db.query.huntsTable.findMany({
        where: and(
          eq(huntsTable.status, "published"),
          like(huntsTable.title, `%${req.query.search}%`)
        ),
        with: { creator: true },
      });
    }

    const hunts = await query;
    res.json(hunts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get hunt by id (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, req.params.id),
      with: {
        creator: true,
        clues: true,
      },
    });
    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }
    res.json(hunt);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Publish hunt (creator only)
router.patch("/:id/publish", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, req.params.id),
      with: { clues: true },
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }
    if (hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your hunt" });
    }
    if (hunt.clues.length < 2) {
      return res.status(400).json({ error: "Need at least 2 clues to publish" });
    }

    const [updated] = await db.update(huntsTable)
      .set({ status: "published" })
      .where(eq(huntsTable.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Archive hunt (creator only)
router.patch("/:id/archive", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, req.params.id),
      with: { teams: { with: { progress: true } } },
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }
    if (hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your hunt" });
    }

    const hasActiveTeam = hunt.teams.some(t => t.progress?.status === "active");
    if (hasActiveTeam) {
      return res.status(400).json({ error: "Cannot archive: active teams exist" });
    }

    const [updated] = await db.update(huntsTable)
      .set({ status: "archived" })
      .where(eq(huntsTable.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get creator's hunts (creator only)
router.get("/dashboard/hunts", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role === "player") {
      return res.status(403).json({ error: "Creators only" });
    }

    const hunts = await db.query.huntsTable.findMany({
      where: eq(huntsTable.creatorId, req.user!.id),
      with: {
        clues: true,
      },
    });

    res.json(hunts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
