import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { huntsTable } from "./hunts";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

// Imports to avoid circular dependencies
import { teamMembersTable } from "./teamMembers";
import { teamProgressTable } from "./teamProgress";
import { clueAttemptsTable } from "./clueAttempts";
import { verificationJobsTable } from "./verificationJobs";

export const teamsTable = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  huntId: uuid("hunt_id").notNull().references(() => huntsTable.id),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  leaderId: uuid("leader_id").notNull().references(() => usersTable.id),
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamsRelations = relations(teamsTable, ({ one, many }) => ({
  hunt: one(huntsTable, {
    fields: [teamsTable.huntId],
    references: [huntsTable.id],
  }),
  leader: one(usersTable, {
    fields: [teamsTable.leaderId],
    references: [usersTable.id],
  }),
  members: many(() => teamMembersTable),
  progress: one(() => teamProgressTable),
  clueAttempts: many(() => clueAttemptsTable),
  verificationJobs: many(() => verificationJobsTable),
}));
