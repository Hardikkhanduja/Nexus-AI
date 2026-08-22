import { useState, useEffect, useCallback } from "react";
import { useClerkSafe, HAS_CLERK_KEY } from "@/lib/clerk";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth, apiFetch } from "@/contexts/AuthContext";

export interface UsageData {
  queriesUsedToday: number;
  dailyQueryLimit: number;
  totalLifetimeQueries: number;
  lastResetDate: string;
  isAuthenticated: boolean;
  plan: string;
}

export function useUsage() {
  const { isSignedIn, isLoaded: clerkLoaded, user: clerkUser } = useClerkSafe();
  const clerkAuth = HAS_CLERK_KEY ? useClerkAuth() : { getToken: null };
  const getClerkToken = clerkAuth?.getToken;
  const { isAuthenticated: customAuth, isLoading: authLoading } = useAuth();
  
  const isAuthenticated = Boolean(isSignedIn || customAuth);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!clerkLoaded && authLoading) return;
    setIsLoading(true);
    setHasError(false);

    try {
      if (getClerkToken) {
        try {
          const clerkToken = await getClerkToken();
          if (clerkToken) {
            localStorage.setItem("clerk_session", clerkToken);
          }
        } catch {}
      }

      const res = await apiFetch("/user/usage");
      if (res.ok) {
        const data: UsageData = await res.json();
        setUsage(data);
      } else {
        // Genuine Error State — No fabricated fallback numbers
        setUsage(null);
        setHasError(true);
      }
    } catch {
      // Genuine Error State — No fabricated fallback numbers
      setUsage(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, clerkLoaded, authLoading, getClerkToken]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, isSignedIn, clerkUser, customAuth]);

  const incrementQuery = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch("/user/query-increment", { method: "POST" });
      if (res.ok) {
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
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const remaining = usage
    ? Math.max(0, usage.dailyQueryLimit - usage.queriesUsedToday)
    : 0;

  return {
    usage,
    isLoading: isLoading || authLoading,
    hasError,
    remaining,
    incrementQuery,
    refetch: fetchUsage,
  };
}
