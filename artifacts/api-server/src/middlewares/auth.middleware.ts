import type { Request, Response, NextFunction } from "express";
import { verifyToken, GUEST_DAILY_LIMIT, REGISTERED_DAILY_LIMIT } from "../lib/auth.config";
import { db } from "@workspace/db";
import { usersTable, userLimitsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Require valid JWT. Rejects with 401 if missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token!);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth: attaches user if valid token present, but doesn't reject if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token!);
      req.user = payload;
    } catch {
      // Token invalid — continue as guest
    }
  }
  next();
}

/**
 * Check and enforce daily query limits.
 * Must be used after optionalAuth or requireAuth.
 * Resets count if date has changed.
 */
export async function checkQueryLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const todayStr = new Date().toISOString().split("T")[0]!;

    if (req.user) {
      // Authenticated user — check DB
      const limits = await db
        .select()
        .from(userLimitsTable)
        .where(eq(userLimitsTable.userId, req.user.userId))
        .limit(1);

      let record = limits[0];
      if (!record) {
        // Create limits row if missing
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

      if (record.queriesUsedToday >= REGISTERED_DAILY_LIMIT) {
        res.status(429).json({
          error: "Daily query limit reached",
          queriesUsed: record.queriesUsedToday,
          dailyLimit: REGISTERED_DAILY_LIMIT,
          resetsAt: "midnight UTC",
        });
        return;
      }
    } else {
      // Guest user — we rely on the API caller to handle guest tracking
      // For now, pass through. The query-increment endpoint handles guest logic.
    }

    next();
  } catch (err) {
    console.error("Error checking query limit:", err);
    next(err);
  }
}
