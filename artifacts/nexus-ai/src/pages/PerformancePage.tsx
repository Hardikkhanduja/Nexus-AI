import React, { useState } from "react";
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
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  throughput: string;
  latency: string;
  winRate: number;
  agreementRate: number;
  contextWindow: string;
  status: "Optimal" | "Active" | "Standby";
  description: string;
}

const MODEL_BENCHMARKS: ModelPerf[] = [
  {
    id: "groq_llama3",
    name: "Groq (Llama 3.3 70B)",
    provider: "Groq LPU Engine",
    icon: Zap,
    color: "#00FFB3",
    throughput: "520 tok/sec",
    latency: "0.28s",
    winRate: 94,
    agreementRate: 91,
    contextWindow: "128,000 tokens",
    status: "Optimal",
    description: "Ultra-fast inference via Groq LPUs. Performs adversarial debate evaluation at lightspeed."
  },
  {
    id: "google_gemini",
    name: "Google Gemini (1.5 / 2.0)",
    provider: "Google AI Studio",
    icon: Sparkles,
    color: "#00C8FF",
    throughput: "185 tok/sec",
    latency: "0.85s",
    winRate: 89,
    agreementRate: 88,
    contextWindow: "1,000,000 tokens",
    status: "Active",
    description: "Massive 1M token context window. Specializes in multi-perspective synthesis & structured JSON."
  },
  {
    id: "anthropic_claude",
    name: "Anthropic Claude 3.5",
    provider: "Anthropic Bedrock",
    icon: Brain,
    color: "#FF4FD8",
    throughput: "140 tok/sec",
    latency: "1.12s",
    winRate: 87,
    agreementRate: 93,
    contextWindow: "200,000 tokens",
    status: "Active",
    description: "Industry-leading reasoning accuracy. Excellent at detecting logical fallacies and edge-case risks."
  },
  {
    id: "openai_gpt4",
    name: "OpenAI GPT-4o Mini",
    provider: "OpenAI API",
    icon: Bot,
    color: "#F59E0B",
    throughput: "160 tok/sec",
    latency: "0.95s",
    winRate: 82,
    agreementRate: 86,
    contextWindow: "128,000 tokens",
    status: "Active",
    description: "Balanced reasoning engine. Well-suited for code architecture and API design evaluations."
  },
  {
    id: "deepseek_r1",
    name: "DeepSeek R1 Reasoning",
    provider: "DeepSeek AI",
    icon: Search,
    color: "#8B5CF6",
    throughput: "110 tok/sec",
    latency: "1.45s",
    winRate: 91,
    agreementRate: 90,
    contextWindow: "64,000 tokens",
    status: "Standby",
    description: "Chain-of-thought mathematical reasoning model. High accuracy on complex step-by-step logic."
  },
  {
    id: "perplexity_sonar",
    name: "Perplexity Sonar Online",
    provider: "Perplexity AI",
    icon: Target,
    color: "#10B981",
    throughput: "135 tok/sec",
    latency: "1.20s",
    winRate: 85,
    agreementRate: 87,
    contextWindow: "32,000 tokens",
    status: "Standby",
    description: "Real-time web search grounding model. Verifies claims against live search indexes."
  }
];

export default function PerformancePage({ onOpenSidebar }: PerformancePageProps) {
  const [, setLocation] = useLocation();
  const [selectedModel, setSelectedModel] = useState<ModelPerf | null>(null);

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
            <Cpu className="w-4 h-4 text-[#00FFB3]" /> AGENT BENCHMARKS & LATENCY
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODEL_BENCHMARKS.map((model, idx) => {
              const Icon = model.icon;
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
                  {React.createElement(selectedModel.icon, { className: "w-5 h-5" })}
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
