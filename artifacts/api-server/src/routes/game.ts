import { Router, Request, Response } from "express";
import { authMiddleware } from "../lib/auth";
import { upload } from "../lib/multer";
import { uploadImage } from "../lib/cloudinary";
import { imageVerificationQueue, type ImageVerificationJobData } from "../lib/queue";
import { db, clueAttemptsTable, cluesTable, teamsTable, teamProgressTable, teamMembersTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { io } from "../app";

const router = Router();

// Get current clue
router.get("/:teamId/active-clue", authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId;

    // Verify user is a member of team
    const member = await db.query.teamMembersTable.findFirst({
      where: (tm, { and, eq }) => and(eq(tm.teamId, teamId), eq(tm.userId, req.user?.id)),
    });
    if (!member) {
      return res.status(403).json({ error: "Not a member of this team" });
    }

    // Get team progress
    const progress = await db.query.teamProgressTable.findFirst({
      where: (p, { eq }) => eq(p.teamId, teamId),
    });
    if (!progress) {
      return res.status(404).json({ error: "Team progress not found" });
    }

    // Get team
    const team = await db.query.teamsTable.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Get all clues for hunt
    const clues = await db.query.cluesTable.findMany({
      where: (c, { eq }) => eq(c.huntId, team.huntId),
      orderBy: (c, { asc }) => [asc(c.defaultOrder)],
    });
    if (!clues.length) {
      return res.status(404).json({ error: "No clues found for hunt" });
    }

    // Determine clue index: use clueSequence if available, otherwise currentStep index
    let clueIndex = progress.currentStep;
    if (progress.clueSequence && progress.clueSequence.length > 0) {
      clueIndex = progress.currentStep;
    }

    if (clueIndex >= clues.length) {
      return res.status(400).json({ error: "All clues solved" });
    }

    const clue = clues[clueIndex];

    // Strip sensitive data
    const safeClue = {
      id: clue.id,
      clueType: clue.clueType,
      hintText: clue.hintText,
      mediaUrl: clue.mediaUrl,
      puzzleType: clue.puzzleType,
      puzzleConfig: clue.puzzleConfig,
    };

    return res.json({ progress, clue: safeClue });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Verify Step (multipart form)
router.post("/verify-step", authMiddleware, upload.single("image_file"), async (req: Request, res: Response) => {
  try {
    const teamId = req.body.team_id as string | undefined;
    const verificationType = req.body.verification_type as string | undefined;
    const textSubmittedRaw = req.body.text_submitted as string | undefined;
    const textSubmitted = textSubmittedRaw ? textSubmittedRaw : undefined;
    const file = req.file;

    // Validation
    if (!teamId) {
      return res.status(400).json({ error: "team_id is required" });
    }
    if (!verificationType || !["image_only", "text_only", "hybrid"].includes(verificationType)) {
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
      orderBy: (a, { desc }) => [desc(a.ts)],
    });

    // Check cooldown
    const lastAttempt = attempts[0];
    if (lastAttempt) {
      // For simplicity, let's track cooldown on clueAttempts or just last attempt time
      // Let's check if last attempt was within 10 minutes and it was 5th attempt
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (attempts.length >= 5 && lastAttempt.ts > tenMinutesAgo) {
        const cooldownUntil = new Date(lastAttempt.ts.getTime() + 10 * 60 * 1000);
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
    let verificationJobId: string | undefined;
    let attemptId: string = randomUUID();
    let attemptStatus: "failed_text" | "processing" | "success" = "processing";

    // Check text first for text-only or hybrid
    if (verificationType === "text_only" || verificationType === "hybrid") {
      const normalizeText = (s: string) => s.trim().toLowerCase();
      if (!clue.textAnswer) {
        return res.status(400).json({ error: "This clue does not require a text answer" });
      }
      textPassed = normalizeText(textSubmitted as string) === normalizeText(clue.textAnswer);
      
      if (!textPassed) {
        // Failed text check: log failed attempt
        attemptStatus = "failed_text";
        await db.insert(clueAttemptsTable).values({
          id: attemptId,
          teamId,
          clueId: clue.id,
          attemptsCount: attempts.length + 1,
          textSubmitted,
          imageUrl,
          verificationType: verificationType as any,
          jobId: verificationJobId,
          status: attemptStatus,
        });

        // Check hint unlock
        const hintUnlockText = (attempts.length + 1) >= 3 ? clue.hintUnlockText : undefined;
        result = { 
          status: "failed_text",
          hint_unlock_text: hintUnlockText,
        };
        if (attempts.length + 1 >= 5) {
          result.cooldown = true;
          result.cooldown_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        }

        return res.status(400).json(result);
      }
    }

    // Handle image verification (image_only or hybrid with text passed)
    if ((verificationType === "image_only" || (verificationType === "hybrid" && textPassed)) && imageUrl) {
      // Create verification job record
      verificationJobId = randomUUID();
      await (db as any).insert((db as any).verificationJobsTable).values({
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
        attemptId,
        teamId,
        clueId: clue.id,
        imageUrl,
        referenceUrl: clue.referenceImg,
        verificationJobId,
      };
      await imageVerificationQueue.add("verify-image", jobData);

      // Save clue attempt as processing
      await db.insert(clueAttemptsTable).values({
        id: attemptId,
        teamId,
        clueId: clue.id,
        attemptsCount: attempts.length + 1,
        textSubmitted,
        imageUrl,
        verificationType: verificationType as any,
        jobId: verificationJobId,
        status: "processing",
      });

      // Check hint unlock
      const hintUnlockText = (attempts.length + 1) >= 3 ? clue.hintUnlockText : undefined;
      result = {
        status: "processing",
        job_id: verificationJobId,
        hint_unlock_text: hintUnlockText,
      };
      if (attempts.length + 1 >= 5) {
        result.cooldown = true;
        result.cooldown_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      }

      return res.status(202).json(result);
    }

    // Handle text-only passed case
    if (verificationType === "text_only" && textPassed) {
      // Save successful attempt
      await db.insert(clueAttemptsTable).values({
        id: attemptId,
        teamId,
        clueId: clue.id,
        attemptsCount: attempts.length + 1,
        textSubmitted,
        imageUrl,
        verificationType: verificationType as any,
        jobId: verificationJobId,
        status: "success",
        solvedAt: new Date(),
      });

      // Advance team progress
      const cluesForHunt = await db.query.cluesTable.findMany({
        where: (c, { eq }) => eq(c.huntId, team.huntId),
        orderBy: (c, { asc }) => [asc(c.defaultOrder)],
      });
      const nextClueIndex = progress.currentStep + 1;
      
      if (nextClueIndex >= cluesForHunt.length) {
        await db.update(teamProgressTable)
          .set({ 
            status: "completed", 
            completedAt: new Date() 
          })
          .where(eq(teamProgressTable.teamId, teamId));
      } else {
        await db.update(teamProgressTable)
          .set({ currentStep: nextClueIndex })
          .where(eq(teamProgressTable.teamId, teamId));
      }

      io.to(`team:${teamId}`).emit("clue_result", {
        status: "success",
        clueId: clue.id,
        teamId,
      });

      result.status = "success";
      // Check hint unlock
      const hintUnlockText = (attempts.length + 1) >= 3 ? clue.hintUnlockText : undefined;
      if (hintUnlockText) {
        result.hint_unlock_text = hintUnlockText;
      }
      if (attempts.length + 1 >= 5) {
        result.cooldown = true;
        result.cooldown_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      }

      return res.json(result);
    }

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Verify Status
router.get("/verify-status/:jobId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const job = await (db.query as any).verificationJobsTable.findFirst({
      where: (j: any, { eq }: any) => eq(j.id, jobId),
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.json(job);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
