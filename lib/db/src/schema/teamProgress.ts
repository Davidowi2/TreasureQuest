import { pgTable, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { teamsTable } from "./teams";
import { relations } from "drizzle-orm";

export const gameStatusEnum = pgEnum("game_status", ["active", "paused", "completed"]);

export const teamProgressTable = pgTable("team_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id).unique(),
  clueSequence: integer("clue_sequence").array().notNull().default([]),
  currentStep: integer("current_step").notNull().default(0),
  status: gameStatusEnum("status").notNull().default("paused"),
  ts: timestamp("ts").notNull().defaultNow(),
  playerCount: integer("player_count").notNull().default(1),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const teamProgressRelations = relations(teamProgressTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [teamProgressTable.teamId],
    references: [teamsTable.id],
  }),
}));

export const insertTeamProgressSchema = createInsertSchema(teamProgressTable).omit({ id: true });
export const selectTeamProgressSchema = createSelectSchema(teamProgressTable);

export type InsertTeamProgress = z.infer<typeof insertTeamProgressSchema>;
export type TeamProgress = z.infer<typeof selectTeamProgressSchema>;
