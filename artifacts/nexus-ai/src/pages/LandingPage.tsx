import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import { SafeSignedIn as SignedIn, SafeSignedOut as SignedOut, SafeUserButton as UserButton } from "@/lib/clerk";
import { useUsage } from "@/hooks/useUsage";
import { Bot, Brain, Sparkles, Search, Zap, Target } from "lucide-react";

interface LandingPageProps {
  onOpenSidebar: () => void;
}

const agents = [
  { name: "GPT", icon: Bot, color: "#00C8FF" },
  { name: "Claude", icon: Brain, color: "#FF4FD8" },
  { name: "Gemini", icon: Sparkles, color: "#00FFB3" },
  { name: "DeepSeek", icon: Search, color: "#00C8FF" },
  { name: "Perplexity", icon: Target, color: "#00FFB3" }
];

export default function LandingPage({ onOpenSidebar }: LandingPageProps) {
  const [, setLocation] = useLocation();
  const { remaining } = useUsage();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      sessionStorage.setItem("nexus_initial_prompt", query.trim());
      setLocation("/chat");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-4" data-testid="page-landing">
      {/* HAMBURGER */}
      <button 
        onClick={onOpenSidebar}
        className="absolute top-6 left-6 p-2.5 bg-background border-2 border-primary/50 rounded-lg transition-all hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] group z-20 cursor-pointer"
        data-testid="button-open-sidebar"
      >
        <div className="flex flex-col gap-[4px] w-[28px]">
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
        </div>
      </button>

      {/* CLERK USER PROFILE AVATAR IN TOP-RIGHT */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <SignedIn>
          <div className="p-0.5 border-2 border-[#00FFB3] rounded-full shadow-[0_0_10px_rgba(0,255,179,0.4)]">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>

        <SignedOut>
          <Link href="/login">
            <button 
              className="px-4 py-2 border-2 border-[#FF4FD8] text-[#FF4FD8] rounded-lg font-sans font-bold text-xs bg-background transition-all hover:bg-[#FF4FD8]/10 hover:shadow-[2px_2px_0px_#FF4FD8] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
              data-testid="header-login-btn"
            >
              <Zap className="w-3.5 h-3.5 fill-[#FF4FD8]" /> LOGIN
            </button>
          </Link>
        </SignedOut>
      </div>

      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 150 }}
        className="mb-12 text-center"
      >
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-tight tracking-tight drop-shadow-[0_0_15px_rgba(0,255,179,0.5)] flex items-center justify-center gap-3">
          <span className="text-[#00FFB3]">NEXUS</span>
          <span className="text-[#FF4FD8] drop-shadow-[0_0_15px_rgba(255,79,216,0.5)]">AI</span>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <Zap className="w-12 h-12 text-amber-400 fill-amber-400" />
          </motion.div>
        </h1>
        <p className="font-sans text-xs text-[#00C8FF] tracking-widest mt-4 font-bold uppercase">
          MULTI-AGENT INTELLIGENCE PLATFORM
        </p>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit}
        className="w-full max-w-[620px] relative z-10 flex flex-col items-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div 
          className={`flex flex-row w-full min-h-[64px] bg-[#08080B] border-[3px] border-[#00FFB3] rounded-xl transition-all duration-200 ${
            isFocused ? 'shadow-[6px_6px_0px_#00FFB3]' : 'shadow-[4px_4px_0px_#00FFB3]'
          }`}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Nexus anything..."
            className="flex-1 bg-transparent border-none outline-none py-4 px-6 text-foreground placeholder:text-primary/40 font-sans text-lg focus:ring-0 rounded-l-xl"
            data-testid="input-search"
          />
          <button 
            type="submit"
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-6 py-4 rounded-r-lg border-l-[3px] border-[#00FFB3] transition-all active:translate-y-[2px] hover:bg-[#00FFB3]/90 flex items-center gap-2 cursor-pointer"
            data-testid="button-launch"
          >
            LAUNCH <Zap className="w-4 h-4 fill-[#0B0B0E]" />
          </button>
        </div>

        <div className="mt-4 text-center space-y-3 flex flex-col items-center">
          <p className="text-[#888888] font-sans">
            Multiple AI minds. One intelligent answer.
          </p>
          <div className="border-2 border-secondary rounded-full px-4 py-1.5 text-sm text-[#00C8FF] font-bold font-sans flex items-center gap-2">
            <Zap className="w-4 h-4 fill-[#00C8FF]" /> {remaining} free queries remaining today
          </div>
        </div>
      </motion.form>

      {/* AGENT PILLS ROW WITH SVG ICONS */}
      <div className="mt-12 w-full max-w-[800px]">
        <p className="font-display text-[8px] text-[#888888] mb-4 tracking-widest text-center uppercase">
          AVAILABLE AGENTS
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {agents.map((agent, index) => {
            const IconComponent = agent.icon;
            return (
              <motion.div
                key={agent.name}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.08, type: "spring" }}
                whileHover={{ rotate: 2, scale: 1.05 }}
                whileTap={{ y: 2, scale: 0.98 }}
                className="bg-[#14141A] border-[3px] rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-shadow"
                style={{ borderColor: agent.color, boxShadow: `3px 3px 0px ${agent.color}`, color: agent.color }}
                data-testid={`pill-agent-${agent.name.toLowerCase()}`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-sans font-semibold text-sm">{agent.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
