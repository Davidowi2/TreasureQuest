import { Router, Request, Response } from "express";
import { db, cluesTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router = Router();

// Create clue
router.post("/:huntId/clues", authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const [clue] = await (db as any).insert(cluesTable).values({
      ...data,
      huntId: req.params.huntId,
    } as any).returning();
    res.status(201).json(clue);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Get clues for hunt
router.get("/:huntId/clues", authMiddleware, async (req: Request, res: Response) => {
  try {
    const clues: any[] = await db.query.cluesTable.findMany({
      where: (c: any, { eq }: any) => eq(c.huntId, req.params.huntId),
    });
    res.json(clues);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Update clue
router.patch("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const [updated] = await (db as any).update(cluesTable)
      .set(req.body as any)
      .where((c: any, { eq }: any) => eq(c.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete clue
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    await (db as any).delete(cluesTable).where((c: any, { eq }: any) => eq(c.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
