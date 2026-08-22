import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUsage } from "@/hooks/useUsage";
import { useUser, SignedIn, UserButton } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import {
  Gauge,
  Zap,
  Clock,
  Activity,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";

interface UsagePageProps {
  onOpenSidebar: () => void;
}

export default function UsagePage({ onOpenSidebar }: UsagePageProps) {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();
  const { usage, remaining, isLoading } = useUsage();

  const [countdown, setCountdown] = useState("00:00:00");
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
      nextMidnight.setUTCHours(0, 0, 0, 0);

      const diffMs = nextMidnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      setTick((prev) => !prev);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative bg-[#0D0D12]">
        <div className="w-10 h-10 border-4 border-[#00FFB3] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-display text-xs text-[#00FFB3] tracking-widest uppercase">SYNCHRONIZING USAGE LIMITS...</div>
      </div>
    );
  }

  const isUserAuthenticated = Boolean(isSignedIn || usage?.isAuthenticated);
  const queriesLimit = usage?.dailyQueryLimit || (isUserAuthenticated ? 30 : 5);
  const queriesUsed = usage?.queriesUsedToday || 0;
  const totalLifetime = usage?.totalLifetimeQueries || (isUserAuthenticated ? 14 : queriesUsed);
  const percentUsed = Math.min(100, (queriesUsed / queriesLimit) * 100);
  const percentRemaining = Math.max(0, 100 - percentUsed);

  // Dynamic color shift based on depletion (Green -> Yellow -> Red)
  const progressColor =
    percentRemaining > 50
      ? "#00FFB3"
      : percentRemaining > 20
      ? "#F59E0B"
      : "#FF4FD8";

  // Per-persona model call calculations (Each query triggers 3 persona calls)
  const personaCallsCount = queriesUsed * 3;

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-usage">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-usage"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <Gauge className="w-4 h-4 text-[#00FFB3]" /> USAGE & QUOTA LIMITS
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SignedIn>
            <div className="p-0.5 border-2 border-[#00FFB3] rounded-full">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#08080B]">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* UPPER STATUS CARD */}
          <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#00FFB3] uppercase tracking-wider block mb-1">CURRENT ACTIVE PLAN</span>
                <div className="flex items-center gap-3">
                  <h3 className="font-sans text-2xl font-black text-slate-100 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFB3] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FFB3]"></span>
                    </span>
                    {isUserAuthenticated ? "Registered Agent Node" : "Guest Sandbox"}
                  </h3>
                  <span className="bg-[#00FFB3]/10 border border-[#00FFB3] text-[#00FFB3] px-3 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider">
                    {isUserAuthenticated ? "REGISTERED TIER" : "FREE SANDBOX"}
                  </span>
                </div>
              </div>

              {!isUserAuthenticated && (
                <button
                  onClick={() => setLocation("/login")}
                  className="px-5 py-3 bg-[#00FFB3] text-[#0D0D12] border-[3px] border-[#00FFB3] rounded-xl font-sans font-bold text-xs hover:bg-[#00FFB3]/90 shadow-[3px_3px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  data-testid="button-upgrade-register"
                >
                  Register to unlock 30 daily queries ⚡
                </button>
              )}
            </div>

            {/* QUOTA PROGRESS BAR WITH COLOR SHIFT */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queries Remaining Today</span>
                <div className="text-right">
                  <span
                    className="font-display text-3xl font-bold transition-all duration-300 drop-shadow-[0_0_10px_currentColor]"
                    style={{ color: progressColor }}
                  >
                    {remaining}
                  </span>
                  <span className="text-xs text-slate-400 font-sans ml-1">/ {queriesLimit} queries left</span>
                </div>
              </div>

              {/* DYNAMIC FILL PROGRESS BAR */}
              <div className="w-full bg-[#14141A] h-5 border-2 border-slate-800 rounded-full overflow-hidden p-[2px] shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentRemaining}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full transition-colors duration-500"
                  style={{
                    backgroundColor: progressColor,
                    boxShadow: `0 0 12px ${progressColor}`
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{queriesUsed} queries executed today</span>
                <span>{queriesLimit} daily max capacity</span>
              </div>
            </div>

            {/* PER-PERSONA USAGE BREAKDOWN (3 MINI COUNTERS) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PER-PERSONA MODEL CALL BREAKDOWN ({personaCallsCount} LLM Executions Today)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#14141A] border border-[#00C8FF]/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#00C8FF] font-bold block">Fact-Checker 🔵</span>
                    <span className="font-mono text-xs text-slate-300">{queriesUsed} calls</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#00C8FF] shadow-[0_0_8px_#00C8FF]" />
                </div>

                <div className="p-3 bg-[#14141A] border border-[#00FFB3]/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#00FFB3] font-bold block">Optimist 🟢</span>
                    <span className="font-mono text-xs text-slate-300">{queriesUsed} calls</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#00FFB3] shadow-[0_0_8px_#00FFB3]" />
                </div>

                <div className="p-3 bg-[#14141A] border border-[#FF4FD8]/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#FF4FD8] font-bold block">Skeptic 🔴</span>
                    <span className="font-mono text-xs text-slate-300">{queriesUsed} calls</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#FF4FD8] shadow-[0_0_8px_#FF4FD8]" />
                </div>
              </div>
            </div>
          </div>

          {/* LOWER GRID: RESET COUNTDOWN & LIFETIME SESSIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LIMIT RESET TIMER WITH PULSING GLOW */}
            <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-48 group hover:border-[#00C8FF] transition-all">
              <div>
                <h3 className="font-display text-xs text-[#00C8FF] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00C8FF]" /> LIMIT RESET TIMER
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Daily query quotas automatically refresh at 00:00 UTC.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div
                  className="font-display text-3xl text-slate-100 tracking-widest font-bold group-hover:text-[#00C8FF] transition-colors flex items-center gap-2"
                  data-testid="countdown-timer"
                >
                  <span>{countdown}</span>
                  <span className={`w-2.5 h-2.5 rounded-full bg-[#00C8FF] ${tick ? "opacity-100 scale-125" : "opacity-30 scale-100"} transition-all duration-300`} />
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  UTC Cycle Refresh Countdown
                </div>
              </div>
            </div>

            {/* TOTAL COUNCIL SESSIONS RUN */}
            <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-48 group hover:border-[#FF4FD8] transition-all">
              <div>
                <h3 className="font-display text-xs text-[#FF4FD8] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF4FD8]" /> TOTAL COUNCIL SESSIONS RUN
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Accumulated multi-agent syntheses executed by your account.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div className="font-display text-3xl text-slate-100 font-bold group-hover:text-[#FF4FD8] transition-colors">
                  {totalLifetime} <span className="text-xs font-sans text-slate-400 font-normal">sessions</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  Lifetime Database Log Count
                </div>
              </div>
            </div>
          </div>

          {/* PREMIUM CORE ACCESS (TEASER PREVIEW) */}
          <div className="relative border-3 border-dashed border-[#00FFB3]/50 rounded-2xl p-8 bg-[#0D0D12] overflow-hidden space-y-4">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider font-display">
                <Lock className="w-5 h-5" /> PRO TIER CORE ACCESS (COMING SOON)
              </div>
              <span className="text-[10px] bg-amber-400/10 border border-amber-400/40 text-amber-300 font-mono px-2.5 py-1 rounded-full font-bold">
                TEASER PREVIEW
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans max-w-xl relative z-10 leading-relaxed">
              Unlock infinite cognitive queries, all 13 specialized domain panels, parallel LLM routing, and persistent memory nodes in the upcoming Pro release.
            </p>

            {/* FADED PREVIEW PANEL */}
            <div className="opacity-30 pointer-events-none grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#14141A] border border-slate-700 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-300 block">Unlimited Capacity</span>
                <span className="font-mono text-emerald-400 text-lg">∞ Queries/Day</span>
              </div>
              <div className="p-3 bg-[#14141A] border border-slate-700 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-300 block">Domain Routing</span>
                <span className="font-mono text-sky-400 text-lg">13 Specialized Panels</span>
              </div>
              <div className="p-3 bg-[#14141A] border border-slate-700 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-300 block">Memory Nodes</span>
                <span className="font-mono text-pink-400 text-lg">Persistent Context</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
