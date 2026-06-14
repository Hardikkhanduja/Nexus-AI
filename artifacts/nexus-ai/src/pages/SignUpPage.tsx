import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength logic
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Empty", color: "#888" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "#FF4F4F" }; // Red
      case 2:
        return { score: 2, label: "Fair", color: "#FFAF4F" }; // Orange
      case 3:
        return { score: 3, label: "Good", color: "#00C8FF" }; // Cyan/Blue
      case 4:
        return { score: 4, label: "Strong", color: "#00FFB3" }; // Neon Green
      default:
        return { score: 1, label: "Weak", color: "#FF4F4F" };
    }
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(name, email, password);
      if (res.success) {
        toast({
          title: "Registration successful!",
          description: "Welcome to Nexus AI.",
        });
        setLocation("/chat");
      } else {
        toast({
          title: "Registration failed",
          description: res.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected network error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative" data-testid="page-signup">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-[440px] cartoon-card p-8 relative overflow-hidden flex flex-col bg-[#0D0D12]"
      >
        {/* LOGO & TITLE */}
        <div className="text-center mb-6">
          <motion.h1
            className="font-display text-2xl tracking-wider text-[#FF4FD8] text-shadow-primary select-none cursor-pointer"
            onClick={() => setLocation("/")}
            whileHover={{ scale: 1.05 }}
          >
            NEXUS AI
          </motion.h1>
          <p className="font-sans text-[10px] text-[#00FFB3] tracking-widest mt-2 font-bold uppercase">
            Create Agent Account
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <div className="text-[10px] text-[#00C8FF] font-display mb-1.5 uppercase">Full Name:</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Neon Neo"
              className="w-full bg-[#14141A] border-3 border-[#FF4FD8]/50 focus:border-[#FF4FD8] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(255,79,216,0.2)] transition-all"
              data-testid="input-signup-name"
              required
            />
          </div>

          <div className="relative">
            <div className="text-[10px] text-[#00C8FF] font-display mb-1.5 uppercase">Email Address:</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="neo@nexus.ai"
              className="w-full bg-[#14141A] border-3 border-[#FF4FD8]/50 focus:border-[#FF4FD8] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(255,79,216,0.2)] transition-all"
              data-testid="input-signup-email"
              required
            />
          </div>

          <div className="relative">
            <div className="text-[10px] text-[#00C8FF] font-display mb-1.5 uppercase">Password:</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#14141A] border-3 border-[#FF4FD8]/50 focus:border-[#FF4FD8] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(255,79,216,0.2)] transition-all"
              data-testid="input-signup-password"
              required
            />
          </div>

          {/* Password strength indicator */}
          <div className="pt-1">
            <div className="flex justify-between items-center text-[9px] font-sans text-muted-foreground mb-1">
              <span>Security Level:</span>
              <span style={{ color: passwordStrength.color, fontWeight: "bold" }}>
                {passwordStrength.label.toUpperCase()}
              </span>
            </div>
            <div className="flex gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      passwordStrength.score >= index
                        ? passwordStrength.color
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FF4FD8] text-[#0D0D12] border-[3px] border-[#FF4FD8] rounded-xl px-4 py-3 mt-4 font-sans font-bold hover:bg-[#FF4FD8]/90 active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: "3px 3px 0px #00C8FF" }}
            data-testid="button-submit-signup"
          >
            {isSubmitting ? "Processing..." : "Register & Connect ⚡"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-6 border-t border-primary/20 pt-4 text-center">
          <div className="text-xs text-muted-foreground font-sans">
            Already registered?{" "}
            <span
              onClick={() => setLocation("/login")}
              className="text-[#00FFB3] font-bold cursor-pointer hover:underline"
              data-testid="link-to-login"
            >
              Sign In here
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
