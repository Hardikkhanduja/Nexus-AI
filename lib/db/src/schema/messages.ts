import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { conversationsTable } from "./conversations";

export const messagesTable = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull().default("GPT"), // e.g. "GPT" or "Claude"
  category: varchar("category", { length: 100 }), // The classifier's detected category for that exchange
  personaRole: varchar("persona_role", { length: 50 }), // fact_checker / optimist / skeptic / synthesizer
  provider: varchar("provider", { length: 50 }), // groq, gemini, perplexity, nvidia, etc.
  latencyMs: integer("latency_ms"),
  wasFallback: boolean("was_fallback").default(false),
  conflictAnalysis: text("conflict_analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
