import { pgTable, serial, uuid, integer, date, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userLimitsTable = pgTable("user_limits", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clerkId: varchar("clerk_id", { length: 255 }).unique(),
  queriesUsedToday: integer("queries_used_today").notNull().default(0),
  lastResetDate: date("last_reset_date").notNull().defaultNow(),
});

export const insertUserLimitsSchema = createInsertSchema(userLimitsTable).omit({
  id: true,
});

export type InsertUserLimits = z.infer<typeof insertUserLimitsSchema>;
export type UserLimits = typeof userLimitsTable.$inferSelect;
