import { pgTable, timestamp, uuid, integer, text, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { teamsTable } from "./teams";
import { cluesTable } from "./clues";
import { relations } from "drizzle-orm";

export const verificationTypeEnum = pgEnum("verification_type", ["image_only", "text_only", "hybrid"]);

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

export const insertClueAttemptSchema = createInsertSchema(clueAttemptsTable).omit({ id: true });
export const selectClueAttemptSchema = createSelectSchema(clueAttemptsTable);

export type InsertClueAttempt = z.infer<typeof insertClueAttemptSchema>;
export type ClueAttempt = z.infer<typeof selectClueAttemptSchema>;
