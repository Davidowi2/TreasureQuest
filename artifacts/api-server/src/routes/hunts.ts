import { Router, Request, Response } from "express";
import { db, huntsTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router = Router();

// Create Hunt
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const [hunt] = await (db as any).insert(huntsTable).values({
      ...data,
      creatorId: req.user?.id || "",
    } as any).returning();
    return res.status(201).json(hunt);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// Get published hunts
router.get("/", async (_req: Request, res: Response) => {
  try {
    const hunts: any[] = await db.query.huntsTable.findMany({
      where: (h: any, { eq }: any) => eq(h.status, "published"),
    });
    return res.json(hunts);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// Get single hunt
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: (h: any, { eq }: any) => eq(h.id, req.params.id),
    });
    if (!hunt) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(hunt);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// Publish hunt
router.patch("/:id/publish", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: (h: any, { eq }: any) => eq(h.id, req.params.id),
    });
    if (!hunt) {
      return res.status(404).json({ error: "Not found" });
    }
    const [updated] = await (db as any).update(huntsTable)
      .set({ status: "published" })
      .where((h: any, { eq }: any) => eq(h.id, req.params.id))
      .returning();
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// Archive hunt
router.patch("/:id/archive", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: (h: any, { eq }: any) => eq(h.id, req.params.id),
    });
    if (!hunt) {
      return res.status(404).json({ error: "Not found" });
    }
    const [updated] = await (db as any).update(huntsTable)
      .set({ status: "archived" })
      .where((h: any, { eq }: any) => eq(h.id, req.params.id))
      .returning();
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// Creator's dashboard hunts
router.get("/dashboard/hunts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunts = await db.query.huntsTable.findMany({
      where: (h: any, { eq }: any) => eq(h.creatorId, req.user?.id || ""),
    });
    return res.json(hunts);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;
