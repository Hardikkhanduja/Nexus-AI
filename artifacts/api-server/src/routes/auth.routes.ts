import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userLimitsTable, userPreferencesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateVerificationToken,
  sendVerificationEmail,
  FRONTEND_URL,
} from "../lib/auth.config";
import { RegisterRequest, LoginRequest } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.middleware";

const router: IRouter = Router();

// ─── POST /auth/register ──────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const { name, email, password } = parsed.data;

    // Check existing user
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        name,
        passwordHash,
        provider: "email",
        emailVerified: false,
        emailVerificationToken: verificationToken,
      })
      .returning();

    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    // Create associated records
    await db.insert(userLimitsTable).values({ userId: user.id });
    await db.insert(userPreferencesTable).values({ userId: user.id });

    // Send verification email (placeholder)
    sendVerificationEmail(email, verificationToken);

    // Generate JWT
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const { email, password } = parsed.data;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    const user = users[0];
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────
router.post("/auth/logout", (_req, res) => {
  // JWT is stateless — client removes token. This endpoint exists for API completeness.
  res.json({ message: "Logged out successfully" });
});

// ─── GET /auth/verify-email/:token ────────────────────────────
router.get("/auth/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.emailVerificationToken, token!))
      .limit(1);

    const user = users[0];
    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    await db
      .update(usersTable)
      .set({ emailVerified: true, emailVerificationToken: null })
      .where(eq(usersTable.id, user.id));

    // Redirect to frontend with success
    res.redirect(`${FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res) => {
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

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── OAuth Stubs (Google & GitHub) ─────────────────────────────
// These require OAuth app credentials to function.
// When credentials are configured, passport strategies will handle the flow.

router.get("/auth/google", (_req, res) => {
  // In production: passport.authenticate('google', { scope: ['profile', 'email'] })
  res.status(501).json({
    error: "Google OAuth not configured",
    message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables",
  });
});

router.get("/auth/google/callback", (_req, res) => {
  res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
});

router.get("/auth/github", (_req, res) => {
  // In production: passport.authenticate('github', { scope: ['user:email'] })
  res.status(501).json({
    error: "GitHub OAuth not configured",
    message: "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables",
  });
});

router.get("/auth/github/callback", (_req, res) => {
  res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
});

export default router;
