import { Worker } from "bullmq";
import { db, teamProgressTable, cluesTable, clueAttemptsTable, teamsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { io } from "../app";
import { logger } from "../lib/logger";
import { redis } from "../lib/queue";

// Mock image similarity check: returns random 0.85-0.99
function mockImageSimilarityCheck(): number {
  return 0.85 + Math.random() * 0.14;
}

// Helper to emit admin stream update
async function emitAdminUpdate(
  teamId: string,
  clueTitle: string,
  attemptStatus: string,
  type: "text" | "image" | "puzzle"
) {
  const team = await db.query.teamsTable.findFirst({
    where: eq(teamsTable.id, teamId),
  });
  if (!team) return;
  io.to("admin_global").emit("admin_stream_update", {
    timestamp: new Date().toISOString(),
    teamName: team.name,
    huntId: team.huntId,
    clueTitle,
    attemptStatus,
    type,
  });
}

// Implement advanceTeamToNextClue inline to avoid import issues
async function advanceTeamToNextClueInline(teamId: string, currentClueId: string) {
  const currentClue = await db.query.cluesTable.findFirst({
    where: eq(cluesTable.id, currentClueId),
  });

  if (!currentClue) throw new Error("Current clue not found");

  const nextClue = await db.query.cluesTable.findFirst({
    where: and(
      eq(cluesTable.huntId, currentClue.huntId),
      gt(cluesTable.defaultOrder, currentClue.defaultOrder)
    ),
    orderBy: (clues, { asc }) => [asc(clues.defaultOrder)],
  });

  if (nextClue) {
    await db.update(teamProgressTable)
      .set({ currentStep: nextClue.defaultOrder })
      .where(eq(teamProgressTable.teamId, teamId));
  } else {
    await db.update(teamProgressTable)
      .set({
        status: "completed",
        completedAt: new Date()
      } as any)
      .where(eq(teamProgressTable.teamId, teamId));
  }

  return nextClue;
}

const worker = new Worker("image-verification", async (job) => {
  const { attemptId, teamId, clueId, imageUrl, referenceUrl, verificationJobId } = job.data;
  logger.info(`Processing verification job ${verificationJobId} for team ${teamId}, clue ${clueId}`);

  try {
    // Update job status to processing
    await (db as any).update((db as any).verificationJobsTable)
      .set({ status: "processing" })
      .where(eq((db as any).verificationJobsTable.id, verificationJobId));

    // Mock similarity check
    const score = mockImageSimilarityCheck();
    const passed = score >= 0.97;

    // Update verification job
    await (db as any).update((db as any).verificationJobsTable)
      .set({
        status: passed ? "passed" : "failed",
        score,
        completedAt: new Date(),
      })
      .where(eq((db as any).verificationJobsTable.id, verificationJobId));

    const clue = await db.query.cluesTable.findFirst({
      where: eq(cluesTable.id, clueId),
    });

    if (passed) {
      // Update clue attempt to success
      await db.update(clueAttemptsTable)
        .set({ status: "success", solvedAt: new Date() } as any)
        .where(eq(clueAttemptsTable.id, attemptId));

      // Emit admin update
      if (clue) {
        await emitAdminUpdate(teamId, clue.hintText, "success", "image");
      }

      // Advance team to next clue
      await advanceTeamToNextClueInline(teamId, clueId);

      // Emit clue_result event to team room
      io.to(`team:${teamId}`).emit("clue_result", {
        status: "success",
        clueId,
        score,
        teamId,
      });
    } else {
      // Update clue attempt - for now, we don't have a "failed_image" status, so we could either:
      // Option 1: Keep as "processing" but that's not accurate
      // Option 2: Create a new status enum value, but let's just update the verification job
      // Emit admin update
      if (clue) {
        await emitAdminUpdate(teamId, clue.hintText, "failed_image", "image");
      }
      // For now, let's just emit the failure
      io.to(`team:${teamId}`).emit("clue_result", {
        status: "failed_image",
        clueId,
        score,
        teamId,
      });
    }

    logger.info(`Verification job ${verificationJobId} completed with status ${passed ? "passed" : "failed"}, score ${score}`);
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
