import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { huntsTable } from "./hunts";
import { relations } from "drizzle-orm";

export const clueTypeEnum = pgEnum("clue_type", ["text", "image", "audio"]);

export const cluesTable = pgTable("clues", {
  id: uuid("id").primaryKey().defaultRandom(),
  huntId: uuid("hunt_id").notNull().references(() => huntsTable.id),
  defaultOrder: integer("default_order").notNull(),
  clueType: clueTypeEnum("clue_type").notNull().default("text"),
  hintText: text("hint_text").notNull(),
  mediaUrl: text("media_url"),
  referenceImg: text("reference_img"),
  hintUnlockText: text("hint_unlock_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cluesRelations = relations(cluesTable, ({ one }) => ({
  hunt: one(huntsTable, {
    fields: [cluesTable.huntId],
    references: [huntsTable.id],
  }),
}));

export const insertClueSchema = createInsertSchema(cluesTable).omit({ id: true, createdAt: true });
export const selectClueSchema = createSelectSchema(cluesTable);

export type InsertClue = z.infer<typeof insertClueSchema>;
export type Clue = z.infer<typeof selectClueSchema>;
