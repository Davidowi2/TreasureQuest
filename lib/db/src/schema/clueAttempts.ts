import { pgTable, timestamp, uuid, integer, text, varchar, pgEnum } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";
import { cluesTable } from "./clues";
import { relations } from "drizzle-orm";

export const verificationTypeEnum = pgEnum("verification_type", ["image_only", "text_only", "hybrid"]);
export const clueAttemptStatusEnum = pgEnum("clue_attempt_status", ["failed_text", "processing", "success"]);

export const clueAttemptsTable = pgTable("clue_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id),
  clueId: uuid("clue_id").notNull().references(() => cluesTable.id),
  attemptsCount: integer("attempts_count").notNull().default(0),
  ts: timestamp("ts").notNull().defaultNow(),
  textSubmitted: varchar("text_submitted"),
  imageUrl: varchar("image_url"),
  verificationType: verificationTypeEnum("verification_type").notNull().default("image_only"),
  jobId: varchar("job_id"),
  status: clueAttemptStatusEnum("status").notNull().default("processing"),
  solvedAt: timestamp("solved_at"),
});

export const clueAttemptsRelations = relations(clueAttemptsTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [clueAttemptsTable.teamId],
    references: [teamsTable.id],
  }),
  clue: one(cluesTable, {
    fields: [clueAttemptsTable.clueId],
    references: [cluesTable.id],
  }),
}));
