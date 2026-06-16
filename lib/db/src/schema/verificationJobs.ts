import { pgTable, timestamp, uuid, text, varchar, pgEnum, decimal } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";
import { cluesTable } from "./clues";
import { relations } from "drizzle-orm";

export const verificationStatusEnum = pgEnum("verification_status", ["pending", "processing", "passed", "failed"]);

export const verificationJobsTable = pgTable("verification_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ts: timestamp("ts").notNull().defaultNow(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id),
  clueId: uuid("clue_id").notNull().references(() => cluesTable.id),
  imageUrl: varchar("image_url"),
  referenceUrl: varchar("reference_url"),
  status: verificationStatusEnum("status").notNull().default("pending"),
  score: decimal("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const verificationJobsRelations = relations(verificationJobsTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [verificationJobsTable.teamId],
    references: [teamsTable.id],
  }),
  clue: one(cluesTable, {
    fields: [verificationJobsTable.clueId],
    references: [cluesTable.id],
  }),
}));
