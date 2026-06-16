import { pgTable, text, timestamp, uuid, pgEnum, integer, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { huntsTable } from "./hunts";
import { relations } from "drizzle-orm";

export const clueTypeEnum = pgEnum("clue_type", ["text", "image", "audio", "interactive_puzzle"]);
export const puzzleTypeEnum = pgEnum("puzzle_type", ["crossword", "jigsaw"]);

export const cluesTable = pgTable("clues", {
  id: uuid("id").primaryKey().defaultRandom(),
  huntId: uuid("hunt_id").notNull().references(() => huntsTable.id),
  defaultOrder: integer("default_order").notNull(),
  clueType: clueTypeEnum("clue_type").notNull().default("text"),
  hintText: text("hint_text").notNull(),
  mediaUrl: text("media_url"),
  referenceImg: text("reference_img"),
  hintUnlockText: text("hint_unlock_text"),
  ts: timestamp("ts").notNull().defaultNow(),
  requiresTextAnswer: boolean("requires_text_answer").notNull().default(false),
  textAnswer: varchar("text_answer"),
  puzzleType: puzzleTypeEnum("puzzle_type"),
  puzzleConfig: jsonb("puzzle_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cluesRelations = relations(cluesTable, ({ one, many }) => ({
  hunt: one(huntsTable, {
    fields: [cluesTable.huntId],
    references: [huntsTable.id],
  }),
  verificationJobs: many(() => verificationJobsTable),
}));

export const insertClueSchema = createInsertSchema(cluesTable).omit({ id: true, createdAt: true });
export const selectClueSchema = createSelectSchema(cluesTable);

export type InsertClue = z.infer<typeof insertClueSchema>;
export type Clue = z.infer<typeof selectClueSchema>;

// Import to avoid circular dependency
import { verificationJobsTable } from "./verificationJobs";
