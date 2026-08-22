import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  Cpu,
  Zap,
  Clock,
  Award,
  Bot,
  Brain,
  Sparkles,
  Search,
  Target,
  ChevronRight,
  Layers,
  Activity,
  Inbox,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PerformancePageProps {
  onOpenSidebar: () => void;
}

interface ModelPerf {
  id: string;
  name: string;
  provider: string;
  iconName: string;
  color: string;
  hasData: boolean;
  totalCalls: number;
  latency: string;
  latencyMs: number;
  winRate: number;
  lastActive: string | null;
  status: "Optimal" | "Active" | "Standby";
  rank: number | null;
  contextWindow: string;
  description: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap: Zap,
  Sparkles: Sparkles,
  Brain: Brain,
  Bot: Bot,
  Search: Search,
  Target: Target,
  Layers: Layers,
};

export default function PerformancePage({ onOpenSidebar }: PerformancePageProps) {
  const [, setLocation] = useLocation();

  const [benchmarks, setBenchmarks] = useState<ModelPerf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPerf | null>(null);

  const fetchPerformance = () => {
    setIsLoading(true);
    setHasError(false);

    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");

    fetch("/api/ai/performance", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.benchmarks && Array.isArray(data.benchmarks)) {
          setBenchmarks(data.benchmarks);
        }
      })
      .catch((err) => {
        console.error("Failed to load live agent benchmarks:", err);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-performance">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-performance"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-sm text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <Cpu className="w-5 h-5 text-[#00FFB3]" /> REAL-TIME AGENT TELEMETRY & LATENCY
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-4 py-2 rounded-xl border-[2px] border-[#00FFB3] shadow-[2px_2px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            Launch Council <ChevronRight className="w-4 h-4" />
          </button>
          <SignedIn>
            <div className="p-0.5 border-2 border-[#00FFB3] rounded-full">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#08080B]">
        <div className="max-w-7xl mx-auto space-y-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-[#00C8FF] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-sm text-[#00C8FF] tracking-widest uppercase">SYNCHRONIZING MODEL PERFORMANCE LOGS...</p>
            </div>
          ) : hasError ? (
            <div className="py-20 bg-[#14141A] border-2 border-rose-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto shadow-2xl">
              <AlertTriangle className="w-12 h-12 text-rose-400 animate-pulse" />
              <h3 className="font-mono text-lg font-bold text-rose-300">Unable to load agent telemetry</h3>
              <p className="text-sm text-slate-400 font-sans">There was a problem querying agent performance benchmarks from the database.</p>
              <button
                onClick={fetchPerformance}
                className="mt-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs px-5 py-2.5 rounded-xl border border-rose-400 shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry Query
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benchmarks.map((model, idx) => {
                const Icon = ICON_MAP[model.iconName] || Cpu;
                const isUnused = !model.hasData;

                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => setSelectedModel(model)}
                    className={`rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isUnused
                        ? "bg-[#0D0D12]/60 border-2 border-dashed border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-80"
                        : model.status === "Optimal"
                        ? "bg-[#0D0D12] border-2 border-slate-800 hover:border-[#00FFB3] shadow-[0_0_15px_rgba(0,255,179,0.15)] hover:shadow-[4px_4px_0px_#00FFB3]"
                        : "bg-[#0D0D12] border-2 border-slate-800 hover:border-[#00C8FF] shadow-[0_0_15px_rgba(0,200,255,0.15)] hover:shadow-[4px_4px_0px_#00C8FF]"
                    }`}
                  >
                    {/* RANK BADGE FOR TOP MODEL */}
                    {model.rank && model.rank === 1 && (
                      <div className="absolute top-0 right-0 bg-[#00FFB3] text-[#0B0B0E] font-mono text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                        🏆 #1 Top Performer
                      </div>
                    )}
                    {model.rank && model.rank > 1 && (
                      <div className="absolute top-0 right-0 bg-slate-800 text-slate-300 font-mono text-xs font-bold px-2.5 py-0.5 rounded-bl-xl border-b border-l border-slate-700">
                        #{model.rank}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4 pr-12">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                            style={{ backgroundColor: `${model.color}15`, borderColor: `${model.color}40`, color: model.color }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-mono font-bold text-sm text-slate-100 group-hover:text-[#00FFB3] transition-colors">
                              {model.name}
                            </h3>
                            <span className="text-xs text-slate-400 font-mono block">{model.provider}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                        {model.description}
                      </p>

                      {/* STATS BLOCK */}
                      {isUnused ? (
                        <div className="bg-[#14141A]/50 p-4 rounded-xl border border-dashed border-slate-800 mb-4 text-center">
                          <span className="text-xs font-mono text-slate-500 block">Not yet in your council rotation</span>
                          <span className="text-xs text-slate-600 font-sans block mt-1">Run a debate using this model to view live latency metrics.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 bg-[#14141A] p-3 rounded-xl border border-slate-800 mb-4 font-mono">
                          <div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Avg Latency</span>
                            <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-sky-400" /> {model.latency}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Calls</span>
                            <span className="text-sm font-bold text-[#00FFB3] flex items-center gap-1.5 mt-0.5">
                              <Activity className="w-3.5 h-3.5 text-[#00FFB3]" /> {model.totalCalls}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      {/* WIN RATE BAR WITH ANIMATION */}
                      {!isUnused ? (
                        <div>
                          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-indigo-400" /> Session Usage Share
                            </span>
                            <span className="font-bold text-slate-100">{model.winRate}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${model.winRate}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: model.color }}
                            />
                          </div>
                          {model.lastActive && (
                            <span className="text-xs font-mono text-slate-500 block mt-2 text-right">
                              Last active {model.lastActive}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                          <span>Status: Standby</span>
                          <span>Context: {model.contextWindow}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        {selectedModel && (
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-slate-100">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${selectedModel.color}20`, borderColor: `${selectedModel.color}60`, color: selectedModel.color }}
                >
                  {React.createElement(ICON_MAP[selectedModel.iconName] || Cpu, { className: "w-5 h-5" })}
                </div>
                <div>
                  <div className="font-bold text-base font-mono">{selectedModel.name}</div>
                  <span className="text-xs text-slate-400 font-mono">{selectedModel.provider}</span>
                </div>
              </DialogTitle>
              <DialogDescription className="text-slate-300 pt-2 text-xs leading-relaxed font-sans">
                {selectedModel.description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3 font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Context Window</span>
                  <span className="font-bold text-slate-200">{selectedModel.contextWindow}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Total User Executions</span>
                  <span className="font-bold text-[#00FFB3]">{selectedModel.totalCalls} calls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Average Measured Latency</span>
                  <span className="font-bold text-sky-400">{selectedModel.latency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Session Usage Share</span>
                  <span className="font-bold text-indigo-400">{selectedModel.winRate}%</span>
                </div>
                {selectedModel.lastActive && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Last Active Timestamp</span>
                    <span className="font-bold text-slate-200">{selectedModel.lastActive}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
