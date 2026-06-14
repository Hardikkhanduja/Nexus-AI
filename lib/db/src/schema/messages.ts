import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { conversationsTable } from "./conversations";

export const messagesTable = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull().default("GPT"), // e.g. "GPT" or "Claude"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
