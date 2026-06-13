import { pgTable, text, timestamp, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const huntStatusEnum = pgEnum("hunt_status", ["draft", "published", "archived"]);
export const huntDifficultyEnum = pgEnum("hunt_difficulty", ["easy", "medium", "hard"]);

export const huntsTable = pgTable("hunts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creatorId: uuid("creator_id").notNull().references(() => usersTable.id),
  status: huntStatusEnum("status").notNull().default("draft"),
  difficulty: huntDifficultyEnum("difficulty").notNull().default("medium"),
  locationTag: text("location_tag").notNull(),
  isShuffled: boolean("is_shuffled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const huntsRelations = relations(huntsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [huntsTable.creatorId],
    references: [usersTable.id],
  }),
  clues: many(() => cluesTable),
  teams: many(() => teamsTable),
}));

export const insertHuntSchema = createInsertSchema(huntsTable).omit({ id: true, createdAt: true });
export const selectHuntSchema = createSelectSchema(huntsTable);

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Hunt = z.infer<typeof selectHuntSchema>;

// Import here to avoid circular dependencies
import { cluesTable } from "./clues";
import { teamsTable } from "./teams";
