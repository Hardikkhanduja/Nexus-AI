import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const { toast } = useToast();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      toast({
        title: "Email Verified",
        description: "Your email has been verified! You can now log in.",
      });
      // Clear URL params
      setLocation("/login", { replace: true });
    } else if (params.get("error") === "oauth_not_configured") {
      toast({
        title: "OAuth Error",
        description: "OAuth provider is not configured. Please use Email Login.",
        variant: "destructive",
      });
      setLocation("/login", { replace: true });
    }
  }, [toast, setLocation]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });
        setLocation("/chat");
      } else {
        toast({
          title: "Login failed",
          description: res.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative" data-testid="page-login">
      {/* CARD */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-[440px] cartoon-card p-8 relative overflow-hidden flex flex-col bg-[#0D0D12]"
      >
        {/* LOGO */}
        <div className="text-center mb-8">
          <motion.h1
            className="font-display text-2xl tracking-wider text-[#00FFB3] text-shadow-primary select-none cursor-pointer"
            onClick={() => setLocation("/")}
            whileHover={{ scale: 1.05 }}
          >
            NEXUS AI
          </motion.h1>
          <p className="font-sans text-[10px] text-[#00C8FF] tracking-widest mt-2 font-bold uppercase">
            Authentication Portal
          </p>
        </div>

        {/* OAUTH BUTTONS AND EMAIL */}
        <div className="space-y-4">
          <button
            onClick={loginWithGoogle}
            className="w-full bg-transparent text-[#00C8FF] border-[3px] border-[#00C8FF] rounded-xl px-4 py-3 flex items-center justify-center gap-3 font-sans font-bold hover:bg-[#00C8FF]/10 active:translate-y-[2px] transition-all"
            style={{ boxShadow: "3px 3px 0px #00C8FF" }}
            data-testid="button-google-login"
          >
            <span className="text-xl">🔵</span>
            Continue with Google
          </button>

          <button
            onClick={loginWithGithub}
            className="w-full bg-transparent text-[#FF4FD8] border-[3px] border-[#FF4FD8] rounded-xl px-4 py-3 flex items-center justify-center gap-3 font-sans font-bold hover:bg-[#FF4FD8]/10 active:translate-y-[2px] transition-all"
            style={{ boxShadow: "3px 3px 0px #FF4FD8" }}
            data-testid="button-github-login"
          >
            <span className="text-xl">🟣</span>
            Continue with GitHub
          </button>

          {!showEmailForm && (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-[#00FFB3] text-[#0D0D12] border-[3px] border-[#00FFB3] rounded-xl px-4 py-3 flex items-center justify-center gap-3 font-sans font-bold hover:bg-[#00FFB3]/90 active:translate-y-[2px] transition-all"
              style={{ boxShadow: "3px 3px 0px #00C8FF" }}
              data-testid="button-expand-email"
            >
              <span className="text-xl">🟢</span>
              Continue with Email
            </button>
          )}

          <AnimatePresence>
            {showEmailForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleEmailLogin}
                className="space-y-4 overflow-hidden pt-2"
              >
                <div className="relative">
                  <div className="text-[10px] text-[#00FFB3] font-display mb-1.5 uppercase">Email:</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@nexus.ai"
                    className="w-full bg-[#14141A] border-3 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-3 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(0,200,255,0.2)] transition-all"
                    data-testid="input-login-email"
                    required
                  />
                </div>

                <div className="relative">
                  <div className="text-[10px] text-[#00FFB3] font-display mb-1.5 uppercase">Password:</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#14141A] border-3 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-3 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(0,200,255,0.2)] transition-all"
                    data-testid="input-login-password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="flex-1 bg-transparent text-[#888] border-[3px] border-[#888] rounded-xl px-4 py-2.5 font-sans font-bold hover:bg-[#888]/10 active:translate-y-[2px] transition-all"
                    data-testid="button-cancel-email"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#00FFB3] text-[#0D0D12] border-[3px] border-[#00FFB3] rounded-xl px-4 py-2.5 font-sans font-bold hover:bg-[#00FFB3]/90 active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                    style={{ boxShadow: "3px 3px 0px #00C8FF" }}
                    data-testid="button-submit-login"
                  >
                    {isSubmitting ? "Connecting..." : "Access System ⚡"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER PILLS */}
        <div className="mt-8 border-t border-primary/20 pt-6 text-center space-y-4">
          <div className="inline-block border-2 border-secondary rounded-full px-4 py-1 text-xs text-[#00C8FF] font-bold font-sans">
            ⚡ 5 free queries available without login
          </div>

          <div className="text-xs text-muted-foreground font-sans">
            New agent in the network?{" "}
            <span
              onClick={() => setLocation("/signup")}
              className="text-[#FF4FD8] font-bold cursor-pointer hover:underline"
              data-testid="link-to-signup"
            >
              Register here
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
