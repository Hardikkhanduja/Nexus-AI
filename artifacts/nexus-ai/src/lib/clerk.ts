import { useUser as useClerkUser } from "@clerk/clerk-react";

export const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
export const HAS_CLERK_KEY = Boolean(
  PUBLISHABLE_KEY && 
  PUBLISHABLE_KEY.startsWith("pk_") && 
  PUBLISHABLE_KEY.length > 30 && 
  !PUBLISHABLE_KEY.includes("dummy")
);

export function useClerkSafe() {
  if (!HAS_CLERK_KEY) {
    return { user: null, isSignedIn: false, isLoaded: true };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkUser();
}
