import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface LandingPageProps {
  onOpenSidebar: () => void;
}

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
      <button 
        onClick={onOpenSidebar}
        className="absolute top-6 left-6 p-2 text-primary hover:bg-primary/10 rounded-sm transition-colors border border-transparent hover:border-primary/50"
        data-testid="button-open-sidebar"
      >
        <div className="flex flex-col gap-[4px] w-6">
          <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
          <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
          <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
        </div>
      </button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="mb-12"
      >
        <motion.h1 
          className="font-display text-[clamp(2rem,6vw,4rem)] text-primary text-center text-shadow-primary tracking-tight"
          initial={{ filter: "brightness(0.5) blur(4px)" }}
          animate={{ filter: "brightness(1) blur(0px)" }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          NEXUS AI
        </motion.h1>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit}
        className="w-full max-w-[600px] relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={`relative bg-[#08080B] rounded-none transition-all duration-300 ${isFocused ? 'glow-border-primary' : 'border border-primary/50 shadow-[0_0_8px_rgba(0,255,179,0.1)]'}`}>
          {/* Pixel corners */}
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-primary"></div>
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-primary"></div>
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-primary"></div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Nexus anything..."
            className="w-full bg-transparent border-none outline-none py-4 px-6 text-foreground placeholder:text-primary/30 font-sans text-lg focus:ring-0"
            data-testid="input-search"
          />
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-secondary/80 font-sans text-sm tracking-wide">
            Multiple AI minds. One intelligent answer.
          </p>
          <p className="text-secondary font-mono text-xs">
            5 free queries remaining today
          </p>
        </div>
      </motion.form>
    </div>
  );
}
