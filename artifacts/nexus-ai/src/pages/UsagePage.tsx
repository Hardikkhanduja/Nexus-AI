import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUsage } from "@/hooks/useUsage";
import { useLocation } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";

interface UsagePageProps {
  onOpenSidebar: () => void;
}

export default function UsagePage({ onOpenSidebar }: UsagePageProps) {
  const [, setLocation] = useLocation();
  const { usage, remaining, isLoading } = useUsage();
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Calculate next midnight UTC
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
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative bg-[#0D0D12]">
        <div className="font-display text-sm text-[#00FFB3] animate-pulse">SYNCHRONIZING USAGE LIMITS...</div>
      </div>
    );
  }

  const queriesLimit = usage?.dailyQueryLimit || 5;
  const queriesUsed = usage?.queriesUsedToday || 0;
  const totalLifetimeQueries = usage?.totalLifetimeQueries || 0;
  const isRegistered = usage?.isAuthenticated || false;
  const percentUsed = Math.min(100, (queriesUsed / queriesLimit) * 100);

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-[#0D0D12]" data-testid="page-usage">
      {/* HEADER */}
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
            USAGE & LIMITS
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
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-[800px] w-full mx-auto pb-16">
        
        {/* UPPER STATUS CARD */}
        <div className="cartoon-card p-8 bg-[#14141A] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-display text-[#00FFB3] uppercase mb-1">Current Active Plan</div>
              <div className="flex items-center gap-3">
                <span className="font-sans text-2xl font-black text-foreground">
                  {isRegistered ? "Registered Agent" : "Guest Sandbox"}
                </span>
                <span className="border-2 border-[#FF4FD8] rounded-full px-3 py-0.5 text-[10px] text-[#FF4FD8] font-bold font-sans tracking-wide">
                  FREE
                </span>
              </div>
            </div>

            {!isRegistered && (
              <button
                onClick={() => setLocation("/login")}
                className="px-5 py-3 bg-[#00FFB3] text-[#0D0D12] border-[3px] border-[#00FFB3] rounded-xl font-sans font-bold text-sm hover:bg-[#00FFB3]/90 active:translate-y-[2px] transition-all self-start md:self-auto"
                style={{ boxShadow: "3px 3px 0px #00C8FF" }}
                data-testid="button-upgrade-register"
              >
                Register for 30 daily queries ⚡
              </button>
            )}
          </div>

          <div className="border-t border-[#00FFB3]/10 pt-6 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-display text-[#888] uppercase">Queries Remaining Today</span>
              <span className="font-display text-2xl text-[#00FFB3] text-shadow-primary">
                {remaining} <span className="text-sm text-muted-foreground">left</span>
              </span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-[#0D0D12] h-5 border-2 border-[#FF4FD8]/30 rounded-full overflow-hidden p-[2px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentUsed}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF4FD8] to-[#00C8FF] shadow-[0_0_8px_#FF4FD8]"
              />
            </div>

            <div className="flex justify-between text-xs font-sans text-muted-foreground">
              <span>{queriesUsed} queries used</span>
              <span>{queriesLimit} max allowed</span>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RESET COUNTDOWN */}
          <div className="cartoon-card-cyan p-6 bg-[#14141A] flex flex-col justify-between h-44">
            <div>
              <h3 className="font-display text-[10px] text-[#00C8FF] mb-2 uppercase">Limit Reset Timer</h3>
              <p className="text-xs text-muted-foreground font-sans">
                Daily query allocations automatically refresh at midnight UTC.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-display text-2xl text-foreground tracking-widest text-shadow-secondary" data-testid="countdown-timer">
                {countdown}
              </div>
              <div className="text-[9px] font-display text-secondary/70 uppercase">
                Time until next cycle
              </div>
            </div>
          </div>

          {/* ALL-TIME STATS */}
          <div className="cartoon-card-pink p-6 bg-[#14141A] flex flex-col justify-between h-44">
            <div>
              <h3 className="font-display text-[10px] text-[#FF4FD8] mb-2 uppercase">Data Transmission</h3>
              <p className="text-xs text-muted-foreground font-sans">
                Accumulated intelligence telemetry sent through this node.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-display text-2xl text-foreground text-shadow-accent">
                {isRegistered ? totalLifetimeQueries : queriesUsed}
              </div>
              <div className="text-[9px] font-display text-accent/70 uppercase">
                Total lifetime queries
              </div>
            </div>
          </div>
        </div>

        {/* UPGRADE CTA PLACEHOLDER */}
        <div className="border-4 border-[#00FFB3] border-dashed rounded-2xl p-8 bg-card/40 text-center space-y-4">
          <h3 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase">PREMIUM CORE ACCESS</h3>
          <p className="text-xs text-muted-foreground font-sans max-w-md mx-auto">
            Unlock infinite cognitive query limits, advanced sub-agent workgroups, parallel processing lines, and persistent memory nodes.
          </p>
          <div className="inline-block border-2 border-dashed border-[#00C8FF] text-[#00C8FF] text-xs font-display px-4 py-2 uppercase">
            Module offline: Coming next epoch
          </div>
        </div>

      </main>
    </div>
  );
}
