import { useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useAuth, apiFetch } from "@/contexts/AuthContext";

interface UsageData {
  queriesUsedToday: number;
  dailyQueryLimit: number;
  totalLifetimeQueries: number;
  lastResetDate: string;
  isAuthenticated: boolean;
  plan: string;
}

const GUEST_COOKIE_KEY = "nexus_guest_queries";
const GUEST_DAILY_LIMIT = 5;
const REGISTERED_DAILY_LIMIT = 30;

function getGuestUsage(): { count: number; date: string } {
  try {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${GUEST_COOKIE_KEY}=`));
    if (raw) {
      const val = JSON.parse(decodeURIComponent(raw.split("=")[1]!));
      return val;
    }
  } catch {}
  return { count: 0, date: new Date().toISOString().split("T")[0]! };
}

function setGuestUsage(count: number, date: string): void {
  const val = encodeURIComponent(JSON.stringify({ count, date }));
  document.cookie = `${GUEST_COOKIE_KEY}=${val}; path=/; max-age=86400; SameSite=Strict`;
}

export function useUsage() {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated: customAuth, isLoading: authLoading } = useAuth();
  
  const isAuthenticated = Boolean(isSignedIn || customAuth);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!clerkLoaded && authLoading) return;

    const todayStr = new Date().toISOString().split("T")[0]!;

    if (!isAuthenticated) {
      // Guest mode — 5 queries limit
      const guest = getGuestUsage();
      const count = guest.date === todayStr ? guest.count : 0;
      setUsage({
        queriesUsedToday: count,
        dailyQueryLimit: GUEST_DAILY_LIMIT,
        totalLifetimeQueries: count,
        lastResetDate: todayStr,
        isAuthenticated: false,
        plan: "Guest Sandbox",
      });
      setIsLoading(false);
      return;
    }

    // Authenticated user — 30 queries limit (or Pro)
    try {
      const res = await apiFetch("/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      } else {
        // Fallback for logged in user
        setUsage({
          queriesUsedToday: 0,
          dailyQueryLimit: REGISTERED_DAILY_LIMIT,
          totalLifetimeQueries: 14,
          lastResetDate: todayStr,
          isAuthenticated: true,
          plan: "Registered Agent",
        });
      }
    } catch {
      setUsage({
        queriesUsedToday: 0,
        dailyQueryLimit: REGISTERED_DAILY_LIMIT,
        totalLifetimeQueries: 14,
        lastResetDate: todayStr,
        isAuthenticated: true,
        plan: "Registered Agent",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, clerkLoaded, authLoading]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementQuery = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      // Guest mode
      const todayStr = new Date().toISOString().split("T")[0]!;
      const guest = getGuestUsage();
      const count = guest.date === todayStr ? guest.count : 0;
      if (count >= GUEST_DAILY_LIMIT) return false;
      const newCount = count + 1;
      setGuestUsage(newCount, todayStr);
      setUsage((prev) =>
        prev ? { ...prev, queriesUsedToday: newCount } : prev
      );
      return true;
    }

    try {
      const res = await apiFetch("/user/query-increment", { method: "POST" });
      const data = await res.json();
      if (data.allowed) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                queriesUsedToday: data.queriesUsedToday,
                totalLifetimeQueries: (prev.totalLifetimeQueries || 0) + 1,
              }
            : prev
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [isAuthenticated]);

  const remaining = usage
    ? usage.dailyQueryLimit - usage.queriesUsedToday
    : 0;

  return {
    usage,
    isLoading: isLoading || authLoading,
    remaining,
    incrementQuery,
    refetch: fetchUsage,
  };
}
