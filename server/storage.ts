import { 
  type User, type InsertUser, 
  type Progress, type InsertProgress,
  type FlashcardState, type InsertFlashcardState,
  type GeneratedUnit, type InsertGeneratedUnit,
  type TrackedProblem, type InsertTrackedProblem,
  type ReviewCardRow, type InsertReviewCard,
  type ReviewCardStateRow, type InsertReviewCardState,
  users, userProgress, flashcardStates, generatedUnits, trackedProblems, reviewCards, reviewCardStates
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProgress(sessionId: string): Promise<Progress | undefined>;
  upsertProgress(data: InsertProgress): Promise<Progress>;
  
  getFlashcardStates(sessionId: string): Promise<FlashcardState[]>;
  upsertFlashcardState(data: InsertFlashcardState): Promise<FlashcardState>;
  
  getGeneratedUnits(): Promise<GeneratedUnit[]>;
  getGeneratedUnit(unitId: string): Promise<GeneratedUnit | undefined>;
  createGeneratedUnit(data: InsertGeneratedUnit): Promise<GeneratedUnit>;
  
  getTrackedProblems(sessionId: string): Promise<TrackedProblem[]>;
  createTrackedProblem(data: InsertTrackedProblem): Promise<TrackedProblem>;
  updateTrackedProblemStatus(id: string, status: string, unitId?: string): Promise<TrackedProblem | undefined>;

  getReviewCards(sessionId: string): Promise<ReviewCardRow[]>;
  upsertReviewCards(data: InsertReviewCard[], maxCards?: number): Promise<ReviewCardRow[]>;
  getReviewCardStates(sessionId: string): Promise<ReviewCardStateRow[]>;
  upsertReviewCardStates(data: InsertReviewCardState[]): Promise<ReviewCardStateRow[]>;
}

export class DatabaseStorage implements IStorage {
  private readonly REVIEW_MAX_CARDS = 200;
  private readonly REVIEW_RETENTION_DAYS = 90;

  private async pruneReviewData(sessionId: string): Promise<void> {
    const cutoff = new Date(Date.now() - this.REVIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    await db
      .delete(reviewCardStates)
      .where(and(eq(reviewCardStates.sessionId, sessionId), lt(reviewCardStates.updatedAt, cutoff)));

    await db
      .delete(reviewCards)
      .where(and(eq(reviewCards.sessionId, sessionId), lt(reviewCards.createdAt, cutoff)));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProgress(sessionId: string): Promise<Progress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.sessionId, sessionId));
    return progress;
  }

  async upsertProgress(data: InsertProgress): Promise<Progress> {
    const existing = await this.getProgress(data.sessionId);
    if (existing) {
      const [updated] = await db
        .update(userProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userProgress.sessionId, data.sessionId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userProgress).values(data).returning();
    return created;
  }

  async getFlashcardStates(sessionId: string): Promise<FlashcardState[]> {
    return db.select().from(flashcardStates).where(eq(flashcardStates.sessionId, sessionId));
  }

  async upsertFlashcardState(data: InsertFlashcardState): Promise<FlashcardState> {
    const [existing] = await db
      .select()
      .from(flashcardStates)
      .where(and(eq(flashcardStates.sessionId, data.sessionId), eq(flashcardStates.cardId, data.cardId)));
    
    if (existing) {
      const [updated] = await db
        .update(flashcardStates)
        .set(data)
        .where(eq(flashcardStates.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(flashcardStates).values(data).returning();
    return created;
  }

  async getGeneratedUnits(): Promise<GeneratedUnit[]> {
    return db.select().from(generatedUnits);
  }

  async getGeneratedUnit(unitId: string): Promise<GeneratedUnit | undefined> {
    const [unit] = await db.select().from(generatedUnits).where(eq(generatedUnits.unitId, unitId));
    return unit;
  }

  async createGeneratedUnit(data: InsertGeneratedUnit): Promise<GeneratedUnit> {
    const [unit] = await db.insert(generatedUnits).values(data).returning();
    return unit;
  }

  async getTrackedProblems(sessionId: string): Promise<TrackedProblem[]> {
    return db.select().from(trackedProblems).where(eq(trackedProblems.sessionId, sessionId));
  }

  async createTrackedProblem(data: InsertTrackedProblem): Promise<TrackedProblem> {
    const [problem] = await db.insert(trackedProblems).values(data).returning();
    return problem;
  }

  async updateTrackedProblemStatus(id: string, status: string, unitId?: string): Promise<TrackedProblem | undefined> {
    const updateData: { status: string; unitId?: string } = { status };
    if (unitId) updateData.unitId = unitId;
    
    const [updated] = await db
      .update(trackedProblems)
      .set(updateData)
      .where(eq(trackedProblems.id, id))
      .returning();
    return updated;
  }

  async getReviewCards(sessionId: string): Promise<ReviewCardRow[]> {
    await this.pruneReviewData(sessionId);
    return db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.sessionId, sessionId))
      .orderBy(desc(reviewCards.createdAt));
  }

  async upsertReviewCards(data: InsertReviewCard[], maxCards = this.REVIEW_MAX_CARDS): Promise<ReviewCardRow[]> {
    if (!data.length) return [];

    for (const card of data) {
      await db
        .insert(reviewCards)
        .values(card)
        .onConflictDoUpdate({
          target: [reviewCards.sessionId, reviewCards.cardId],
          set: {
            unitId: card.unitId,
            type: card.type,
            source: card.source,
            cardData: card.cardData,
          },
        });
    }

    const sessionId = data[0].sessionId;
    await this.pruneReviewData(sessionId);
    const all = await db
      .select()
      .from(reviewCards)
      .where(eq(reviewCards.sessionId, sessionId))
      .orderBy(desc(reviewCards.createdAt));

    if (all.length > maxCards) {
      const toDrop = all.slice(maxCards);
      const idsToDrop = toDrop.map((row) => row.id);
      const cardIdsToDrop = toDrop.map((row) => row.cardId);

      await db.delete(reviewCards).where(and(eq(reviewCards.sessionId, sessionId), inArray(reviewCards.id, idsToDrop)));
      if (cardIdsToDrop.length) {
        await db
          .delete(reviewCardStates)
          .where(and(eq(reviewCardStates.sessionId, sessionId), inArray(reviewCardStates.cardId, cardIdsToDrop)));
      }
    }

    return this.getReviewCards(sessionId);
  }

  async getReviewCardStates(sessionId: string): Promise<ReviewCardStateRow[]> {
    await this.pruneReviewData(sessionId);
    return db.select().from(reviewCardStates).where(eq(reviewCardStates.sessionId, sessionId));
  }

  async upsertReviewCardStates(data: InsertReviewCardState[]): Promise<ReviewCardStateRow[]> {
    if (!data.length) return [];

    for (const state of data) {
      await db
        .insert(reviewCardStates)
        .values(state)
        .onConflictDoUpdate({
          target: [reviewCardStates.sessionId, reviewCardStates.cardId],
          set: {
            stateData: state.stateData,
            updatedAt: new Date(),
          },
        });
    }

    return this.getReviewCardStates(data[0].sessionId);
  }
}

export const storage = new DatabaseStorage();
