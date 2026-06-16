import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { huntsTable } from "./hunts";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const huntPlayersTable = pgTable("hunt_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  ts: timestamp("ts").notNull().defaultNow(),
  huntId: uuid("hunt_id").notNull().references(() => huntsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const huntPlayersRelations = relations(huntPlayersTable, ({ one }) => ({
  hunt: one(huntsTable, {
    fields: [huntPlayersTable.huntId],
    references: [huntsTable.id],
  }),
  user: one(usersTable, {
    fields: [huntPlayersTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertHuntPlayerSchema = createInsertSchema(huntPlayersTable).omit({ id: true, ts: true, joinedAt: true });
export const selectHuntPlayerSchema = createSelectSchema(huntPlayersTable);

export type InsertHuntPlayer = z.infer<typeof insertHuntPlayerSchema>;
export type HuntPlayer = z.infer<typeof selectHuntPlayerSchema>;
