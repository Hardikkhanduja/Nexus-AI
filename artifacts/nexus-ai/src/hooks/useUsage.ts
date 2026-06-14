import { useState, useEffect, useCallback } from "react";
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Guest mode — use cookie
      const guest = getGuestUsage();
      const todayStr = new Date().toISOString().split("T")[0]!;
      const count = guest.date === todayStr ? guest.count : 0;
      setUsage({
        queriesUsedToday: count,
        dailyQueryLimit: GUEST_DAILY_LIMIT,
        totalLifetimeQueries: 0,
        lastResetDate: todayStr,
        isAuthenticated: false,
        plan: "free",
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

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
