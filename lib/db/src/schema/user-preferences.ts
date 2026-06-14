import { pgTable, serial, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPreferencesTable = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  preferredCodingLanguage: varchar("preferred_coding_language", { length: 100 }),
  preferredWritingStyle: varchar("preferred_writing_style", { length: 100 }),
  favoriteAgents: text("favorite_agents")
    .array()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(
  userPreferencesTable
).omit({
  id: true,
  createdAt: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferencesTable.$inferSelect;
