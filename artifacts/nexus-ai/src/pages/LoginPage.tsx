import React, { useState } from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();
  const { isAuthenticated: isLocalAuth, login, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isUserSignedIn = Boolean(isSignedIn || isLocalAuth);

  React.useEffect(() => {
    if (isUserSignedIn) {
      setLocation("/chat");
    }
  }, [isUserSignedIn, setLocation]);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      await refreshUser();
      setLocation("/chat");
    } else {
      setError(res.error || "Invalid credentials");
    }
  };

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative bg-[#08080B]" data-testid="page-login">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md flex flex-col items-center gap-6"
      >
        <div className="text-center cursor-pointer" onClick={() => setLocation("/")}>
          <h1 className="font-display text-3xl tracking-wider flex items-center justify-center gap-2">
            <span className="text-[#00FFB3]">NEXUS</span>
            <span className="text-[#FF4FD8]">AI</span>
          </h1>
          <p className="font-sans text-xs text-[#00C8FF] tracking-widest mt-1 uppercase font-bold">
            AUTHENTICATE COGNITIVE NODE
          </p>
        </div>

        {publishableKey ? (
          <div className="w-full border-2 border-[#00FFB3] rounded-2xl p-4 bg-[#14141A] shadow-[4px_4px_0px_#00FFB3]">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              forceRedirectUrl="/chat"
              fallbackRedirectUrl="/chat"
            />
          </div>
        ) : (
          <form onSubmit={handleCustomLogin} className="w-full cartoon-card p-6 bg-[#14141A] space-y-4">
            <h3 className="font-display text-sm text-[#00FFB3] uppercase">Agent Login</h3>
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-display text-[#00C8FF] uppercase mb-1">Email Node</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="agent@nexus-ai.io"
                className="w-full bg-[#0D0D12] border-2 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-display text-[#00C8FF] uppercase mb-1">Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0D0D12] border-2 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00FFB3] text-[#0D0D12] border-2 border-[#00FFB3] rounded-xl font-sans font-bold text-sm hover:bg-[#00FFB3]/90 shadow-[3px_3px_0px_#00C8FF] active:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? "Authenticating..." : <>AUTHENTICATE <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="pt-2 text-center text-xs text-muted-foreground font-sans">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#FF4FD8] font-bold hover:underline">
                Register Node
              </Link>
            </div>
          </form>
        )}

        <button
          onClick={() => setLocation("/chat")}
          className="text-xs font-mono text-[#00C8FF] hover:text-[#00FFB3] transition-colors cursor-pointer flex items-center gap-1"
        >
          Continue in Guest Sandbox Mode <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
}
