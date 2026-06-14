import { useState, useEffect, useCallback } from "react";
import { useAuth, apiFetch } from "@/contexts/AuthContext";

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
  stats: {
    queriesUsedToday: number;
    dailyQueryLimit: number;
    totalLifetimeQueries: number;
    conversationCount: number;
    favoriteAgents: string[];
  };
}

interface PreferencesData {
  preferredCodingLanguage: string | null;
  preferredWritingStyle: string | null;
  favoriteAgents: string[];
}

export function useProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [profileRes, prefsRes] = await Promise.all([
        apiFetch("/user/profile"),
        apiFetch("/user/preferences"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }
      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: { name?: string; avatarUrl?: string | null }) => {
      try {
        const res = await apiFetch("/user/profile", {
          method: "PUT",
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile((prev) => (prev ? { ...prev, ...data } : prev));
          return { success: true };
        }
        const err = await res.json();
        return { success: false, error: err.error };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    []
  );

  const updatePreferences = useCallback(
    async (updates: Partial<PreferencesData>) => {
      try {
        const res = await apiFetch("/user/preferences", {
          method: "PUT",
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences(data);
          return { success: true };
        }
        const err = await res.json();
        return { success: false, error: err.error };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    []
  );

  return {
    profile,
    preferences,
    isLoading: isLoading || authLoading,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile,
  };
}
