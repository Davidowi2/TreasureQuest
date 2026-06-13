import { pgTable, timestamp, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { teamsTable } from "./teams";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const teamRoleEnum = pgEnum("team_role", ["leader", "member"]);

export const teamMembersTable = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teamsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  teamRole: teamRoleEnum("team_role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [teamMembersTable.teamId],
    references: [teamsTable.id],
  }),
  user: one(usersTable, {
    fields: [teamMembersTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertTeamMemberSchema = createInsertSchema(teamMembersTable).omit({ id: true, joinedAt: true });
export const selectTeamMemberSchema = createSelectSchema(teamMembersTable);

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = z.infer<typeof selectTeamMemberSchema>;
