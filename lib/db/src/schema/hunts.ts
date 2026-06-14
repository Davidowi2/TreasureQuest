import { pgTable, text, timestamp, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { usersTable } from "./users";

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

export type InsertHunt = InferModel<typeof huntsTable, "insert">;
export type Hunt = InferModel<typeof huntsTable, "select">;
