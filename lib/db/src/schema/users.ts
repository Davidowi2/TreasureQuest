import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["creator", "player", "both"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertUser = InferModel<typeof usersTable, "insert">;
export type User = Omit<InferModel<typeof usersTable, "select">, "passwordHash">;
