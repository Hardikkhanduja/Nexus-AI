import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  userLimitsTable,
  userPreferencesTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware";
import { GUEST_DAILY_LIMIT, REGISTERED_DAILY_LIMIT } from "../lib/auth.config";
import { UpdateProfileRequest, UpdatePreferencesRequest } from "@workspace/api-zod";

const router: IRouter = Router();

// ─── GET /user/profile ────────────────────────────────────────
router.get("/user/profile", requireAuth, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get limits
    const limits = await db
      .select()
      .from(userLimitsTable)
      .where(eq(userLimitsTable.userId, user.id))
      .limit(1);

    const todayStr = new Date().toISOString().split("T")[0]!;
    let queriesUsedToday = 0;
    if (limits[0]) {
      queriesUsedToday =
        limits[0].lastResetDate === todayStr ? limits[0].queriesUsedToday : 0;
    }

    // Get preferences
    const prefs = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, user.id))
      .limit(1);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      stats: {
        queriesUsedToday,
        dailyQueryLimit: REGISTERED_DAILY_LIMIT,
        totalLifetimeQueries: user.totalLifetimeQueries,
        conversationCount: 0, // TODO: implement when conversations table exists
        favoriteAgents: prefs[0]?.favoriteAgents ?? [],
      },
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /user/profile ────────────────────────────────────────
router.put("/user/profile", requireAuth, async (req, res) => {
  try {
    const parsed = UpdateProfileRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates["name"] = parsed.data.name;
    if (parsed.data.avatarUrl !== undefined)
      updates["avatarUrl"] = parsed.data.avatarUrl;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, req.user!.userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      provider: updated.provider,
      emailVerified: updated.emailVerified,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /user/usage ──────────────────────────────────────────
router.get("/user/usage", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // Guest usage
      res.json({
        queriesUsedToday: 0,
        dailyQueryLimit: GUEST_DAILY_LIMIT,
        totalLifetimeQueries: 0,
        lastResetDate: new Date().toISOString().split("T")[0],
        isAuthenticated: false,
        plan: "free",
      });
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0]!;

    // Get limits
    const limits = await db
      .select()
      .from(userLimitsTable)
      .where(eq(userLimitsTable.userId, req.user.userId))
      .limit(1);

    let record = limits[0];
    if (!record) {
      const inserted = await db
        .insert(userLimitsTable)
        .values({ userId: req.user.userId, queriesUsedToday: 0, lastResetDate: todayStr })
        .returning();
      record = inserted[0]!;
    }

    // Reset if new day
    let queriesUsedToday = record.queriesUsedToday;
    if (record.lastResetDate !== todayStr) {
      await db
        .update(userLimitsTable)
        .set({ queriesUsedToday: 0, lastResetDate: todayStr })
        .where(eq(userLimitsTable.userId, req.user.userId));
      queriesUsedToday = 0;
    }

    // Get lifetime total
    const users = await db
      .select({ totalLifetimeQueries: usersTable.totalLifetimeQueries })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.userId))
      .limit(1);

    res.json({
      queriesUsedToday,
      dailyQueryLimit: REGISTERED_DAILY_LIMIT,
      totalLifetimeQueries: users[0]?.totalLifetimeQueries ?? 0,
      lastResetDate: todayStr,
      isAuthenticated: true,
      plan: "free",
    });
  } catch (err) {
    console.error("Usage fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /user/query-increment ───────────────────────────────
router.post("/user/query-increment", optionalAuth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0]!;

    if (!req.user) {
      // Guest: no server-side tracking for now, client-side cookie fallback
      res.json({
        queriesUsedToday: 0,
        dailyQueryLimit: GUEST_DAILY_LIMIT,
        remaining: GUEST_DAILY_LIMIT,
        allowed: true,
      });
      return;
    }

    // Get or create limits
    const limits = await db
      .select()
      .from(userLimitsTable)
      .where(eq(userLimitsTable.userId, req.user.userId))
      .limit(1);

    let record = limits[0];
    if (!record) {
      const inserted = await db
        .insert(userLimitsTable)
        .values({ userId: req.user.userId, queriesUsedToday: 0, lastResetDate: todayStr })
        .returning();
      record = inserted[0]!;
    }

    // Reset if new day
    if (record.lastResetDate !== todayStr) {
      await db
        .update(userLimitsTable)
        .set({ queriesUsedToday: 0, lastResetDate: todayStr })
        .where(eq(userLimitsTable.userId, req.user.userId));
      record.queriesUsedToday = 0;
    }

    // Check limit before incrementing
    if (record.queriesUsedToday >= REGISTERED_DAILY_LIMIT) {
      res.status(429).json({
        queriesUsedToday: record.queriesUsedToday,
        dailyQueryLimit: REGISTERED_DAILY_LIMIT,
        remaining: 0,
        allowed: false,
      });
      return;
    }

    // Increment
    const newCount = record.queriesUsedToday + 1;
    await db
      .update(userLimitsTable)
      .set({ queriesUsedToday: newCount })
      .where(eq(userLimitsTable.userId, req.user.userId));

    // Also increment lifetime counter
    await db
      .update(usersTable)
      .set({
        totalLifetimeQueries: sql`${usersTable.totalLifetimeQueries} + 1`,
      })
      .where(eq(usersTable.id, req.user.userId));

    res.json({
      queriesUsedToday: newCount,
      dailyQueryLimit: REGISTERED_DAILY_LIMIT,
      remaining: REGISTERED_DAILY_LIMIT - newCount,
      allowed: true,
    });
  } catch (err) {
    console.error("Query increment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /user/preferences ────────────────────────────────────
router.get("/user/preferences", requireAuth, async (req, res) => {
  try {
    const prefs = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user!.userId))
      .limit(1);

    if (!prefs[0]) {
      // Create default preferences
      const [created] = await db
        .insert(userPreferencesTable)
        .values({ userId: req.user!.userId })
        .returning();
      res.json({
        preferredCodingLanguage: created!.preferredCodingLanguage,
        preferredWritingStyle: created!.preferredWritingStyle,
        favoriteAgents: created!.favoriteAgents,
      });
      return;
    }

    res.json({
      preferredCodingLanguage: prefs[0].preferredCodingLanguage,
      preferredWritingStyle: prefs[0].preferredWritingStyle,
      favoriteAgents: prefs[0].favoriteAgents,
    });
  } catch (err) {
    console.error("Preferences fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /user/preferences ────────────────────────────────────
router.put("/user/preferences", requireAuth, async (req, res) => {
  try {
    const parsed = UpdatePreferencesRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.preferredCodingLanguage !== undefined)
      updates["preferredCodingLanguage"] = parsed.data.preferredCodingLanguage;
    if (parsed.data.preferredWritingStyle !== undefined)
      updates["preferredWritingStyle"] = parsed.data.preferredWritingStyle;
    if (parsed.data.favoriteAgents !== undefined)
      updates["favoriteAgents"] = parsed.data.favoriteAgents;

    // Upsert: try update first, then insert if not found
    const existing = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user!.userId))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(userPreferencesTable)
        .set(updates)
        .where(eq(userPreferencesTable.userId, req.user!.userId))
        .returning();
      res.json({
        preferredCodingLanguage: updated!.preferredCodingLanguage,
        preferredWritingStyle: updated!.preferredWritingStyle,
        favoriteAgents: updated!.favoriteAgents,
      });
    } else {
      const [created] = await db
        .insert(userPreferencesTable)
        .values({ userId: req.user!.userId, ...updates })
        .returning();
      res.json({
        preferredCodingLanguage: created!.preferredCodingLanguage,
        preferredWritingStyle: created!.preferredWritingStyle,
        favoriteAgents: created!.favoriteAgents,
      });
    }
  } catch (err) {
    console.error("Preferences update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
