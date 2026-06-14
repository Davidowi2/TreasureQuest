import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { huntsTable } from "./hunts";

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

export type InsertClue = InferModel<typeof cluesTable, "insert">;
export type Clue = InferModel<typeof cluesTable, "select">;
