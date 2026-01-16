import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProgressSchema, insertGeneratedUnitSchema, insertTrackedProblemSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Progress endpoints
  app.get("/api/progress/:sessionId", async (req, res) => {
    try {
      const progress = await storage.getProgress(req.params.sessionId);
      res.json(progress || { completedUnits: [], unlockedUnits: ['two-sum'], parsonsProgress: {} });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const data = insertProgressSchema.parse(req.body);
      const progress = await storage.upsertProgress(data);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid progress data" });
    }
  });

  // Flashcard states
  app.get("/api/flashcards/:sessionId", async (req, res) => {
    try {
      const states = await storage.getFlashcardStates(req.params.sessionId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcard states" });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const { sessionId, cardId, nextReview, interval, repetition, efactor } = req.body;
      const state = await storage.upsertFlashcardState({
        sessionId,
        cardId,
        nextReview: new Date(nextReview),
        interval,
        repetition,
        efactor
      });
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard data" });
    }
  });

  // Generated units
  app.get("/api/units", async (req, res) => {
    try {
      const units = await storage.getGeneratedUnits();
      res.json(units.map(u => u.unitData));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.get("/api/units/:unitId", async (req, res) => {
    try {
      const unit = await storage.getGeneratedUnit(req.params.unitId);
      if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return;
      }
      res.json(unit.unitData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unit" });
    }
  });

  app.post("/api/units", async (req, res) => {
    try {
      const { unitId, unitData } = req.body;
      const unit = await storage.createGeneratedUnit({ unitId, unitData });
      res.json(unit);
    } catch (error) {
      res.status(400).json({ error: "Invalid unit data" });
    }
  });

  // Tracked problems
  app.get("/api/problems/:sessionId", async (req, res) => {
    try {
      const problems = await storage.getTrackedProblems(req.params.sessionId);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  app.post("/api/problems", async (req, res) => {
    try {
      const data = insertTrackedProblemSchema.parse(req.body);
      const problem = await storage.createTrackedProblem(data);
      res.json(problem);
    } catch (error) {
      res.status(400).json({ error: "Invalid problem data" });
    }
  });

  app.patch("/api/problems/:id", async (req, res) => {
    try {
      const { status, unitId } = req.body;
      const problem = await storage.updateTrackedProblemStatus(req.params.id, status, unitId);
      if (!problem) {
        res.status(404).json({ error: "Problem not found" });
        return;
      }
      res.json(problem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update problem" });
    }
  });

  return httpServer;
}
