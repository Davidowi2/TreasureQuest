import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { cluesTable, huntsTable } from "@workspace/db/schema";
import { authMiddleware } from "../lib/auth";
import { upload } from "../lib/multer";
import { uploadImage } from "../lib/cloudinary";
import { z } from "zod";

const router = Router();

// Create clue (creator only)
const createClueSchema = z.object({
  clueType: z.enum(["text", "image", "audio"]).default("text"),
  hintText: z.string(),
  hintUnlockText: z.string().optional(),
});

router.post("/:huntId/clues", authMiddleware, upload.fields([
  { name: "media", maxCount: 1 },
  { name: "reference", maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, req.params.huntId),
      with: { clues: true },
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }
    if (hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your hunt" });
    }
    if (hunt.status === "published") {
      return res.status(400).json({ error: "Cannot modify published hunt" });
    }

    const data = createClueSchema.parse(req.body);
    const clueCount = hunt.clues.length;

    let mediaUrl: string | undefined;
    let referenceImg: string | undefined;

    // @ts-ignore
    if (req.files?.media?.[0]) {
      // @ts-ignore
      mediaUrl = await uploadImage(req.files.media[0].path);
    }
    // @ts-ignore
    if (req.files?.reference?.[0]) {
      // @ts-ignore
      referenceImg = await uploadImage(req.files.reference[0].path);
    }

    const [clue] = await db.insert(cluesTable).values({
      ...data,
      huntId: req.params.huntId,
      defaultOrder: clueCount + 1,
      mediaUrl,
      referenceImg,
    }).returning();

    res.status(201).json(clue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get clues for hunt (creator only)
router.get("/:huntId/clues", authMiddleware, async (req: Request, res: Response) => {
  try {
    const hunt = await db.query.huntsTable.findFirst({
      where: eq(huntsTable.id, req.params.huntId),
    });

    if (!hunt) {
      return res.status(404).json({ error: "Hunt not found" });
    }
    if (hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your hunt" });
    }

    const clues = await db.query.cluesTable.findMany({
      where: eq(cluesTable.huntId, req.params.huntId),
      orderBy: (clues, { asc }) => [asc(clues.defaultOrder)],
    });

    res.json(clues);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update clue (creator only)
router.patch("/:id", authMiddleware, upload.fields([
  { name: "media", maxCount: 1 },
  { name: "reference", maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const clue = await db.query.cluesTable.findFirst({
      where: eq(cluesTable.id, req.params.id),
      with: { hunt: true },
    });

    if (!clue) {
      return res.status(404).json({ error: "Clue not found" });
    }
    if (clue.hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your clue" });
    }
    if (clue.hunt.status === "published") {
      return res.status(400).json({ error: "Cannot modify published hunt" });
    }

    const updateData: any = {};
    if (req.body.hintText) updateData.hintText = req.body.hintText;
    if (req.body.hintUnlockText) updateData.hintUnlockText = req.body.hintUnlockText;
    if (req.body.clueType) updateData.clueType = req.body.clueType;

    // @ts-ignore
    if (req.files?.media?.[0]) {
      // @ts-ignore
      updateData.mediaUrl = await uploadImage(req.files.media[0].path);
    }
    // @ts-ignore
    if (req.files?.reference?.[0]) {
      // @ts-ignore
      updateData.referenceImg = await uploadImage(req.files.reference[0].path);
    }

    const [updated] = await db.update(cluesTable)
      .set(updateData)
      .where(eq(cluesTable.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete clue (creator only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const clue = await db.query.cluesTable.findFirst({
      where: eq(cluesTable.id, req.params.id),
      with: { hunt: true },
    });

    if (!clue) {
      return res.status(404).json({ error: "Clue not found" });
    }
    if (clue.hunt.creatorId !== req.user?.id) {
      return res.status(403).json({ error: "Not your clue" });
    }
    if (clue.hunt.status === "published") {
      return res.status(400).json({ error: "Cannot modify published hunt" });
    }

    await db.delete(cluesTable).where(eq(cluesTable.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
