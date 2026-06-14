import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { huntsTable } from "./hunts";
import { usersTable } from "./users";

export const teamsTable = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  huntId: uuid("hunt_id").notNull().references(() => huntsTable.id),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  leaderId: uuid("leader_id").notNull().references(() => usersTable.id),
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type InsertTeam = InferModel<typeof teamsTable, "insert">;
export type Team = InferModel<typeof teamsTable, "select">;
