import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// ─── Config ────────────────────────────────────────────────────

const JWT_SECRET = process.env["JWT_SECRET"] || "nexus-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "24h";
const BCRYPT_ROUNDS = 12;

export const GUEST_DAILY_LIMIT = 5;
export const REGISTERED_DAILY_LIMIT = 30;

export const OAUTH_CONFIG = {
  google: {
    clientID: process.env["GOOGLE_CLIENT_ID"] || "",
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"] || "",
    callbackURL: "/api/auth/google/callback",
  },
  github: {
    clientID: process.env["GITHUB_CLIENT_ID"] || "",
    clientSecret: process.env["GITHUB_CLIENT_SECRET"] || "",
    callbackURL: "/api/auth/github/callback",
  },
};

export const FRONTEND_URL = process.env["FRONTEND_URL"] || "http://localhost:5173";

// ─── JWT Helpers ───────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// ─── Password Helpers ──────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Email Verification ────────────────────────────────────────

export function generateVerificationToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Placeholder: In production, integrate with SendGrid / Resend / etc.
 * For now, logs the verification link to console.
 */
export function sendVerificationEmail(email: string, token: string): void {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`📧 EMAIL VERIFICATION (dev mode)`);
  console.log(`   To: ${email}`);
  console.log(`   Link: ${verifyUrl}`);
  console.log(`══════════════════════════════════════════════════\n`);
}
