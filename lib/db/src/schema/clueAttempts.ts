import { pgTable, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { teamsTable } from "./teams";
import { cluesTable } from "./clues";

export const clueAttemptsTable = pgTable("clue_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id),
  clueId: uuid("clue_id").notNull().references(() => cluesTable.id),
  attemptsCount: integer("attempts_count").notNull().default(0),
  solvedAt: timestamp("solved_at"),
});

export type InsertClueAttempt = InferModel<typeof clueAttemptsTable, "insert">;
export type ClueAttempt = InferModel<typeof clueAttemptsTable, "select">;
