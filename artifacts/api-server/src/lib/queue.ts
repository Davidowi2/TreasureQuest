import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const imageVerificationQueue = new Queue("image-verification", {
  connection,
});

export type ImageVerificationJobData = {
  teamId: string;
  clueId: string;
  imageUrl: string;
  referenceUrl?: string | null;
  verificationJobId: string;
};
