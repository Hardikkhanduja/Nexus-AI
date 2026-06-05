import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface LandingPageProps {
  onOpenSidebar: () => void;
}

const agents = [
  { name: "GPT", emoji: "🤖", color: "#00C8FF" },
  { name: "Claude", emoji: "🧠", color: "#FF4FD8" },
  { name: "Gemini", emoji: "✨", color: "#00FFB3" },
  { name: "DeepSeek", emoji: "🔍", color: "#00C8FF" },
  { name: "Mistral", emoji: "⚡", color: "#FF4FD8" },
  { name: "Perplexity", emoji: "🎯", color: "#00FFB3" }
];

export default function LandingPage({ onOpenSidebar }: LandingPageProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation("/chat");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-4" data-testid="page-landing">
      {/* HAMBURGER */}
      <button 
        onClick={onOpenSidebar}
        className="absolute top-6 left-6 p-2.5 bg-background border-2 border-primary/50 rounded-lg transition-all hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] group z-20"
        data-testid="button-open-sidebar"
      >
        <div className="flex flex-col gap-[4px] w-[28px]">
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
          <div className="h-[4px] bg-[#00FFB3] w-full rounded-full"></div>
        </div>
      </button>

      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 150 }}
        className="mb-12 text-center"
      >
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-tight tracking-tight drop-shadow-[0_0_15px_rgba(0,255,179,0.5)]">
          <span className="text-[#00FFB3]">NEXUS</span>
          <br />
          <span className="text-[#FF4FD8] drop-shadow-[0_0_15px_rgba(255,79,216,0.5)]">AI</span>
          <motion.span 
            className="inline-block ml-4 text-5xl"
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            ⚡
          </motion.span>
        </h1>
        <p className="font-sans text-xs text-[#00C8FF] tracking-widest mt-6 font-bold">
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
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-6 py-4 rounded-r-lg border-l-[3px] border-[#00FFB3] transition-all active:translate-y-[2px] hover:bg-[#00FFB3]/90 flex items-center gap-2"
            data-testid="button-launch"
          >
            LAUNCH ⚡
          </button>
        </div>

        <div className="mt-4 text-center space-y-3 flex flex-col items-center">
          <p className="text-[#888888] font-sans">
            Multiple AI minds. One intelligent answer.
          </p>
          <div className="border-2 border-secondary rounded-full px-4 py-1.5 text-sm text-[#00C8FF] font-bold font-sans flex items-center gap-2">
            ⚡ 5 free queries remaining today
          </div>
        </div>
      </motion.form>

      {/* AGENT PILLS ROW */}
      <div className="mt-12 w-full max-w-[800px]">
        <p className="font-display text-[8px] text-[#888888] mb-4 tracking-widest text-center">
          AVAILABLE AGENTS
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ rotate: 2, scale: 1.05 }}
              whileTap={{ y: 2, scale: 0.98, boxShadow: `0px 0px 0px ${agent.color}` }}
              className="bg-[#14141A] border-[3px] rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-shadow"
              style={{ borderColor: agent.color, boxShadow: `3px 3px 0px ${agent.color}`, color: agent.color }}
              data-testid={`pill-agent-${agent.name.toLowerCase()}`}
            >
              <span className="text-xl">{agent.emoji}</span>
              <span className="font-sans font-semibold text-sm">{agent.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}