import { z } from "zod/v4";

// ─── Auth Request/Response Schemas ─────────────────────────────

export const RegisterRequest = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const AuthTokenResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    provider: z.string(),
    emailVerified: z.boolean(),
  }),
});
export type AuthTokenResponse = z.infer<typeof AuthTokenResponse>;

export const AuthUserResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  provider: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
});
export type AuthUserResponse = z.infer<typeof AuthUserResponse>;

// ─── User Profile Schemas ──────────────────────────────────────

export const UserProfileResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  provider: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  stats: z.object({
    queriesUsedToday: z.number(),
    dailyQueryLimit: z.number(),
    totalLifetimeQueries: z.number(),
    conversationCount: z.number(),
    favoriteAgents: z.array(z.string()),
  }),
});
export type UserProfileResponse = z.infer<typeof UserProfileResponse>;

export const UpdateProfileRequest = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

export const UpdatePreferencesRequest = z.object({
  preferredCodingLanguage: z.string().max(100).optional().nullable(),
  preferredWritingStyle: z.string().max(100).optional().nullable(),
  favoriteAgents: z.array(z.string()).optional(),
});
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequest>;

// ─── Usage & Limits Schemas ────────────────────────────────────

export const UsageLimitsResponse = z.object({
  queriesUsedToday: z.number(),
  dailyQueryLimit: z.number(),
  totalLifetimeQueries: z.number(),
  lastResetDate: z.string(),
  isAuthenticated: z.boolean(),
  plan: z.string().default("free"),
});
export type UsageLimitsResponse = z.infer<typeof UsageLimitsResponse>;

export const QueryIncrementResponse = z.object({
  queriesUsedToday: z.number(),
  dailyQueryLimit: z.number(),
  remaining: z.number(),
  allowed: z.boolean(),
});
export type QueryIncrementResponse = z.infer<typeof QueryIncrementResponse>;

// ─── Preferences Response ──────────────────────────────────────

export const UserPreferencesResponse = z.object({
  preferredCodingLanguage: z.string().nullable(),
  preferredWritingStyle: z.string().nullable(),
  favoriteAgents: z.array(z.string()),
});
export type UserPreferencesResponse = z.infer<typeof UserPreferencesResponse>;
