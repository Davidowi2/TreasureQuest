import { Router, Request, Response } from "express";
import { authMiddleware } from "../lib/auth";
import { upload } from "../lib/multer";
import { uploadImage } from "../lib/cloudinary";
import { imageVerificationQueue, type ImageVerificationJobData } from "../lib/queue";
import { db, clueAttemptsTable, cluesTable, teamsTable, verificationJobsTable, teamProgressTable, verificationStatusEnum } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { io } from "../app";

const router = Router();

// Get current clue
router.get("/:teamId/active-clue", authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ progress: null, clue: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify Step (multipart form)
router.post("/verify-step", authMiddleware, upload.single("image_file"), async (req: Request, res: Response) => {
  try {
    const { team_id: teamId, verification_type: verificationType, text_submitted: textSubmittedRaw } = req.body;
    const textSubmitted = textSubmittedRaw ? (textSubmittedRaw as string) : undefined;
    const file = req.file;

    // Validation
    if (!teamId) {
      return res.status(400).json({ error: "team_id is required" });
    }
    if (!["image_only", "text_only", "hybrid"].includes(verificationType)) {
      return res.status(400).json({ error: "Invalid verification_type" });
    }
    if ((verificationType === "image_only" || verificationType === "hybrid") && !file) {
      return res.status(400).json({ error: "image_file is required for this verification type" });
    }
    if ((verificationType === "text_only" || verificationType === "hybrid") && !textSubmitted) {
      return res.status(400).json({ error: "text_submitted is required for this verification type" });
    }

    // Get team and current clue (let's get team progress first)
    const team = await db.query.teamsTable.findFirst({ where: (t, { eq }) => eq(t.id, teamId) });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    const progress = await db.query.teamProgressTable.findFirst({ where: (p, { eq }) => eq(p.teamId, teamId) });
    if (!progress) {
      return res.status(404).json({ error: "Team progress not found" });
    }

    // Get current clue: for now, let's assume currentStep is index into clueSequence
    const clues = await db.query.cluesTable.findMany({
      where: (c, { eq }) => eq(c.huntId, team.huntId),
      orderBy: (c, { asc }) => [asc(c.defaultOrder)],
    });
    if (progress.currentStep >= clues.length) {
      return res.status(400).json({ error: "All clues solved" });
    }
    const clue = clues[progress.currentStep];

    // Get existing attempts for this team and clue
    const attempts = await db.query.clueAttemptsTable.findMany({
      where: (a, { and, eq }) => and(eq(a.teamId, teamId), eq(a.clueId, clue.id)),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });

    // Check cooldown
    const lastAttempt = attempts[0];
    if (lastAttempt) {
      // For simplicity, let's track cooldown on clueAttempts or just last attempt time
      // Let's check if last attempt was within 10 minutes and it was 5th attempt
      const fiveMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (attempts.length >= 5 && lastAttempt.createdAt > fiveMinutesAgo) {
        const cooldownUntil = new Date(lastAttempt.createdAt.getTime() + 10 * 60 * 1000);
        return res.json({
          status: "cooldown",
          cooldown_until: cooldownUntil.toISOString(),
        });
      }
    }

    // Upload image to Cloudinary if needed
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await uploadImage(file.path);
    }

    // Initialize response variables
    let result: any = { status: "pending" };
    let textPassed = true;
    let needsQueue = false;
    let verificationJobId: string | undefined;

    // Check text first for text-only or hybrid
    if (verificationType === "text_only" || verificationType === "hybrid") {
      const normalizeText = (s: string) => s.trim().toLowerCase();
      if (!clue.textAnswer) {
        return res.status(400).json({ error: "This clue does not require a text answer" });
      }
      textPassed = normalizeText(textSubmitted) === normalizeText(clue.textAnswer);
      if (verificationType === "text_only") {
        result = {
          status: textPassed ? "passed" : "failed",
        };
      }
      if (verificationType === "hybrid" && !textPassed) {
        // Fail immediately if text fails for hybrid
        result = { status: "failed" };
      }
    }

    // Handle image verification (image_only or hybrid with text passed)
    if ((verificationType === "image_only" || (verificationType === "hybrid" && textPassed)) && imageUrl) {
      // Create verification job record
      verificationJobId = randomUUID();
      await db.insert(verificationJobsTable).values({
        id: verificationJobId,
        teamId,
        clueId: clue.id,
        imageUrl,
        referenceUrl: clue.referenceImg,
        status: "pending",
        createdAt: new Date(),
      });

      // Add job to queue
      const jobData: ImageVerificationJobData = {
        teamId,
        clueId: clue.id,
        imageUrl,
        referenceUrl: clue.referenceImg,
        verificationJobId,
      };
      await imageVerificationQueue.add("verify-image", jobData);

      needsQueue = true;
      result = {
        status: "processing",
        job_id: verificationJobId,
      };
    }

    // Save clue attempt
    await db.insert(clueAttemptsTable).values({
      teamId,
      clueId: clue.id,
      attemptsCount: attempts.length + 1,
      textSubmitted,
      imageUrl,
      verificationType: verificationType as any,
      jobId: verificationJobId,
    });

    // Check hint unlock and cooldown
    const hintUnlockText = (attempts.length + 1) >= 3 ? clue.hintUnlockText : undefined;
    if (hintUnlockText) {
      result.hint_unlock_text = hintUnlockText;
    }
    if (attempts.length + 1 >= 5) {
      result.cooldown = true;
      result.cooldown_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    }

    // If text-only passed, advance step
    if (verificationType === "text_only" && textPassed) {
      await db.update(teamProgressTable)
        .set({ currentStep: progress.currentStep + 1 })
        .where(eq(teamProgressTable.id, progress.id));

      io.to(`team:${teamId}`).emit("clue_solved", {
        clueId: clue.id,
        teamId,
      });
      result.status = "passed";
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify Status
router.get("/verify-status/:jobId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await db.query.verificationJobsTable.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.json(job);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
