import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new IORedis(REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
});

export const imageVerificationQueue = new Queue("image-verification", {
  connection: redis,
});

export type ImageVerificationJobData = {
  teamId: string;
  clueId: string;
  imageUrl: string;
  referenceUrl?: string | null;
  verificationJobId: string;
};

export { redis };
