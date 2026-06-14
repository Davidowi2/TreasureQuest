import { pgTable, timestamp, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const teamRoleEnum = pgEnum("team_role", ["leader", "member"]);

export const teamMembersTable = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  teamRole: teamRoleEnum("team_role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export type InsertTeamMember = InferModel<typeof teamMembersTable, "insert">;
export type TeamMember = InferModel<typeof teamMembersTable, "select">;
