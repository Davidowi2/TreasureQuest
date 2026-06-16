import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db, verificationJobsTable, clueAttemptsTable, teamProgressTable, cluesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { io } from "../app";
import { logger } from "../lib/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// Mock image similarity check: returns random 0.85-0.99
function mockImageSimilarityCheck(): number {
  return 0.85 + Math.random() * 0.14;
}

const worker = new Worker("image-verification", async (job) => {
  const { teamId, clueId, imageUrl, referenceUrl, verificationJobId } = job.data;
  logger.info(`Processing verification job ${verificationJobId} for team ${teamId}, clue ${clueId}`);

  try {
    // Update job status to processing
    await db.update(verificationJobsTable)
      .set({ status: "processing" })
      .where(eq(verificationJobsTable.id, verificationJobId));

    // Mock similarity check
    const score = mockImageSimilarityCheck();
    const passed = score >= 0.97;

    // Get clue attempt
    const attempt = await db.query.clueAttemptsTable.findFirst({
      where: (a, { eq }) => eq(a.id, verificationJobId), // Wait no, verification job has jobId or use teamId+clueId?
      // Or let's get by teamId and clueId, latest attempt
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      where: (a, { and, eq }) => and(eq(a.teamId, teamId), eq(a.clueId, clueId)),
    });

    const clue = await db.query.cluesTable.findFirst({
      where: (c, { eq }) => eq(c.id, clueId),
    });

    const verificationType = attempt?.verificationType;
    const textPassed = verificationType === "hybrid" && attempt?.textSubmitted && clue?.textAnswer ? 
      (attempt.textSubmitted.trim().toLowerCase() === clue.textAnswer.trim().toLowerCase()) : 
      (verificationType !== "hybrid");

    const overallPassed = textPassed && passed;

    // Update verification job
    await db.update(verificationJobsTable)
      .set({
        status: overallPassed ? "passed" : "failed",
        score,
        completedAt: new Date(),
      })
      .where(eq(verificationJobsTable.id, verificationJobId));

    // Emit clue_solved event to team room if passed
    if (overallPassed) {
      io.to(`team:${teamId}`).emit("clue_solved", {
        clueId,
        score,
        teamId,
      });

      // Advance team progress current step
      const progress = await db.query.teamProgressTable.findFirst({
        where: (p, { eq }) => eq(p.teamId, teamId),
      });

      if (progress) {
        await db.update(teamProgressTable)
          .set({ currentStep: progress.currentStep + 1 })
          .where(eq(teamProgressTable.id, progress.id));
      }
    }

    logger.info(`Verification job ${verificationJobId} completed with status ${overallPassed ? "passed" : "failed"}, score ${score}`);
  } catch (err) {
    logger.error(`Error processing verification job ${verificationJobId}`, err);

    // Mark job as failed
    await db.update(verificationJobsTable)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq(verificationJobsTable.id, verificationJobId));
  }
}, { connection });

worker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed`, err);
});

export { worker };
