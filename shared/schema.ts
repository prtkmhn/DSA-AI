import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  completedUnits: text("completed_units").array().default(sql`ARRAY[]::text[]`),
  unlockedUnits: text("unlocked_units").array().default(sql`ARRAY['two-sum']::text[]`),
  parsonsProgress: jsonb("parsons_progress").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgressSchema = createInsertSchema(userProgress).omit({ id: true, updatedAt: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof userProgress.$inferSelect;

export const flashcardStates = pgTable("flashcard_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  cardId: text("card_id").notNull(),
  nextReview: timestamp("next_review").notNull(),
  interval: integer("interval").notNull().default(0),
  repetition: integer("repetition").notNull().default(0),
  efactor: integer("efactor").notNull().default(250),
});

export const insertFlashcardStateSchema = createInsertSchema(flashcardStates).omit({ id: true });
export type InsertFlashcardState = z.infer<typeof insertFlashcardStateSchema>;
export type FlashcardState = typeof flashcardStates.$inferSelect;

export const generatedUnits = pgTable("generated_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: text("unit_id").notNull().unique(),
  unitData: jsonb("unit_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratedUnitSchema = createInsertSchema(generatedUnits).omit({ id: true, createdAt: true });
export type InsertGeneratedUnit = z.infer<typeof insertGeneratedUnitSchema>;
export type GeneratedUnit = typeof generatedUnits.$inferSelect;

export const trackedProblems = pgTable("tracked_problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("generating"),
  unitId: text("unit_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackedProblemSchema = createInsertSchema(trackedProblems).omit({ id: true, createdAt: true });
export type InsertTrackedProblem = z.infer<typeof insertTrackedProblemSchema>;
export type TrackedProblem = typeof trackedProblems.$inferSelect;

export const reviewCards = pgTable(
  "review_cards",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: text("session_id").notNull(),
    cardId: text("card_id").notNull(),
    unitId: text("unit_id").notNull(),
    type: text("type").notNull(),
    source: text("source").notNull().default("ai"),
    cardData: jsonb("card_data").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    sessionCardUnique: uniqueIndex("review_cards_session_card_uidx").on(table.sessionId, table.cardId),
  })
);

export const insertReviewCardSchema = createInsertSchema(reviewCards).omit({ id: true, createdAt: true });
export type InsertReviewCard = z.infer<typeof insertReviewCardSchema>;
export type ReviewCardRow = typeof reviewCards.$inferSelect;

export const reviewCardStates = pgTable(
  "review_card_states",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: text("session_id").notNull(),
    cardId: text("card_id").notNull(),
    stateData: jsonb("state_data").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    sessionCardUnique: uniqueIndex("review_states_session_card_uidx").on(table.sessionId, table.cardId),
  })
);

export const insertReviewCardStateSchema = createInsertSchema(reviewCardStates).omit({ id: true, updatedAt: true });
export type InsertReviewCardState = z.infer<typeof insertReviewCardStateSchema>;
export type ReviewCardStateRow = typeof reviewCardStates.$inferSelect;
