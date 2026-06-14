import { pgTable, serial, uuid, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userMemoryTable = pgTable(
  "user_memory",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    memoryKey: varchar("memory_key", { length: 255 }).notNull(),
    memoryValue: text("memory_value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("user_memory_unique").on(table.userId, table.memoryKey)]
);

export const insertUserMemorySchema = createInsertSchema(userMemoryTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemoryTable.$inferSelect;
