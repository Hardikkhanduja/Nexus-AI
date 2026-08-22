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
  ChevronRight
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
  throughput: string;
  latency: string;
  winRate: number;
  agreementRate: number;
  contextWindow: string;
  status: "Optimal" | "Active" | "Standby";
  description: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap: Zap,
  Sparkles: Sparkles,
  Brain: Brain,
  Bot: Bot,
  Search: Search,
  Target: Target,
};

export default function PerformancePage({ onOpenSidebar }: PerformancePageProps) {
  const [, setLocation] = useLocation();

  const [benchmarks, setBenchmarks] = useState<ModelPerf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelPerf | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");

    fetch("/api/ai/performance", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.benchmarks && Array.isArray(data.benchmarks)) {
          setBenchmarks(data.benchmarks);
        }
      })
      .catch((err) => {
        console.error("Failed to load live agent benchmarks:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <Cpu className="w-4 h-4 text-[#00FFB3]" /> REAL-TIME AGENT BENCHMARKS & LATENCY
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-3.5 py-1.5 rounded-xl border-[2px] border-[#00FFB3] shadow-[2px_2px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
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
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-[#00C8FF] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-display text-xs text-[#00C8FF] tracking-widest uppercase">SYNCHRONIZING MODEL PERFORMANCE LOGS...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benchmarks.map((model, idx) => {
                const Icon = ICON_MAP[model.iconName] || Cpu;
                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => setSelectedModel(model)}
                    className="bg-[#0D0D12] border-2 border-slate-800 hover:border-[#00FFB3] rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[4px_4px_0px_#00FFB3] group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border"
                            style={{ backgroundColor: `${model.color}15`, borderColor: `${model.color}40`, color: model.color }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#00FFB3] transition-colors">
                              {model.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 block">{model.provider}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            model.status === "Optimal"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {model.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                        {model.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 bg-[#14141A] p-3 rounded-xl border border-slate-800 mb-4">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Throughput</span>
                          <span className="font-display text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                            <Zap className="w-3 h-3 text-amber-400" /> {model.throughput}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Avg Latency</span>
                          <span className="font-display text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-sky-400" /> {model.latency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-indigo-400" /> Synthesis Win Rate
                        </span>
                        <span className="font-bold text-slate-100">{model.winRate}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${model.winRate}%`, backgroundColor: model.color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
                  <div className="font-bold text-base">{selectedModel.name}</div>
                  <span className="text-xs text-slate-400">{selectedModel.provider}</span>
                </div>
              </DialogTitle>
              <DialogDescription className="text-slate-300 pt-2 text-xs leading-relaxed">
                {selectedModel.description}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Context Window</span>
                  <span className="font-bold text-slate-200">{selectedModel.contextWindow}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Consensus Agreement Rate</span>
                  <span className="font-bold text-emerald-400">{selectedModel.agreementRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Streaming Protocol</span>
                  <span className="font-bold text-sky-400">Server-Sent Events (SSE)</span>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
