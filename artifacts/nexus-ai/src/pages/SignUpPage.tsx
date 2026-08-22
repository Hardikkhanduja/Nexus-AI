import React, { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useClerkSafe, HAS_CLERK_KEY } from "@/lib/clerk";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useClerkSafe();
  const { isAuthenticated: isLocalAuth, register, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isUserSignedIn = Boolean(isSignedIn || isLocalAuth);

  React.useEffect(() => {
    if (isUserSignedIn) {
      setLocation("/");
    }
  }, [isUserSignedIn, setLocation]);

  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);
    if (res.success) {
      await refreshUser();
      setLocation("/chat");
    } else {
      setError(res.error || "Could not create account");
    }
  };

  const showClerk = HAS_CLERK_KEY;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-[#08080B]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h1
            onClick={() => setLocation("/")}
            className="font-display text-3xl tracking-wider text-[#00FFB3] cursor-pointer hover:scale-105 transition-transform"
          >
            NEXUS AI
          </h1>
          <p className="font-sans text-xs text-[#FF4FD8] tracking-widest mt-1 uppercase font-bold">
            Create your Nexus Account
          </p>
        </div>

        {showClerk ? (
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
          />
        ) : (
          <form onSubmit={handleCustomRegister} className="w-full cartoon-card p-6 bg-[#14141A] space-y-4">
            <h3 className="font-display text-sm text-[#00FFB3] uppercase">Register Node</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-display text-[#00C8FF] uppercase mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Agent Name"
                className="w-full bg-[#0D0D12] border-2 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans text-sm"
              />
            </div>

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
              {isLoading ? "Creating..." : <>CREATE ACCOUNT <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="pt-2 text-center text-xs text-muted-foreground font-sans">
              Already have an account?{" "}
              <Link href="/login" className="text-[#FF4FD8] font-bold hover:underline">
                Sign In
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