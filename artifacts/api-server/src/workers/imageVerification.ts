import { Worker } from "bullmq";
import { db, teamProgressTable, cluesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { io } from "../app";
import { logger } from "../lib/logger";
import { redis } from "../lib/queue";

// Mock image similarity check: returns random 0.85-0.99
function mockImageSimilarityCheck(): number {
  return 0.85 + Math.random() * 0.14;
}

const worker = new Worker("image-verification", async (job) => {
  const { teamId, clueId, imageUrl, referenceUrl, verificationJobId } = job.data;
  logger.info(`Processing verification job ${verificationJobId} for team ${teamId}, clue ${clueId}`);

  try {
    // Update job status to processing
    await (db as any).update((db as any).verificationJobsTable)
      .set({ status: "processing" })
      .where(eq((db as any).verificationJobsTable.id, verificationJobId));

    // Mock similarity check
    const score = mockImageSimilarityCheck();
    const passed = score >= 0.97;

    // Get clue attempt by jobId
    const attempt = await (db.query as any).clueAttemptsTable.findFirst({
      where: (a: any, { eq }: any) => eq(a.jobId, verificationJobId),
    });

    const clue = await (db.query as any).cluesTable.findFirst({
      where: (c: any, { eq }: any) => eq(c.id, clueId),
    });

    const verificationType = (attempt as any)?.verificationType;
    const textPassed = verificationType === "hybrid" && (attempt as any)?.textSubmitted && (clue as any)?.textAnswer ? 
      (((attempt as any).textSubmitted as string).trim().toLowerCase() === ((clue as any).textAnswer as string).trim().toLowerCase()) : 
      (verificationType !== "hybrid");

    const overallPassed = textPassed && passed;

    // Update verification job
    await (db as any).update((db as any).verificationJobsTable)
      .set({
        status: overallPassed ? "passed" : "failed",
        score,
        completedAt: new Date(),
      })
      .where(eq((db as any).verificationJobsTable.id, verificationJobId));

    // Update clue attempt: set solvedAt if passed
    if (attempt && overallPassed) {
      await (db as any).update((db as any).clueAttemptsTable)
        .set({ solvedAt: new Date() })
        .where(eq((db as any).clueAttemptsTable.id, (attempt as any).id));
    }

    // Emit clue_solved event to team room if passed
    if (overallPassed) {
      io.to(`team:${teamId}`).emit("clue_solved", {
        clueId,
        score,
        teamId,
      });

      // Advance team progress current step
      const progress = await (db.query as any).teamProgressTable.findFirst({
        where: (p: any, { eq }: any) => eq(p.teamId, teamId),
      });

      if (progress) {
        await (db as any).update(teamProgressTable)
          .set({ currentStep: progress.currentStep + 1 })
          .where(eq(teamProgressTable.id, progress.id));
      }
    }

    logger.info(`Verification job ${verificationJobId} completed with status ${overallPassed ? "passed" : "failed"}, score ${score}`);
  } catch (err) {
    logger.error(`Error processing verification job ${verificationJobId}`, err as any);

    // Mark job as failed
    await (db as any).update((db as any).verificationJobsTable)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq((db as any).verificationJobsTable.id, verificationJobId));
  }
}, { connection: redis as any });

worker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed`, err as any);
});

export { worker };
