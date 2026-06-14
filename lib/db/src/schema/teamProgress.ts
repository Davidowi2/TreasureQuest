import { pgTable, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { teamsTable } from "./teams";

export const gameStatusEnum = pgEnum("game_status", ["active", "paused", "completed"]);

export const teamProgressTable = pgTable("team_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id).unique(),
  clueSequence: integer("clue_sequence").array().notNull().default([]),
  currentStep: integer("current_step").notNull().default(0),
  status: gameStatusEnum("status").notNull().default("paused"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export type InsertTeamProgress = InferModel<typeof teamProgressTable, "insert">;
export type TeamProgress = InferModel<typeof teamProgressTable, "select">;
