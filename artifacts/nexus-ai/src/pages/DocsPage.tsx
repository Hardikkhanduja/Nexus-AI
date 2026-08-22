import React, { useState } from "react";
import { useLocation } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  BookOpen,
  Terminal,
  Layers,
  Zap,
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocsPageProps {
  onOpenSidebar: () => void;
}

export default function DocsPage({ onOpenSidebar }: DocsPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyCode = (code: string, sectionId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(sectionId);
    toast({ title: "Copied", description: "Code snippet copied to clipboard." });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-docs">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-docs"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <BookOpen className="w-4 h-4 text-[#00FFB3]" /> SYSTEM DOCUMENTATION
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-3.5 py-1.5 rounded-xl border-[2px] border-[#00FFB3] shadow-[2px_2px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          >
            Try In Chat <ChevronRight className="w-4 h-4" />
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
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
              <Layers className="w-5 h-5" /> 1. Multi-Agent Orchestration Protocol
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Nexus AI operates a 4-LLM heterogeneous council engine. When a user submits a prompt:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-[#14141A] border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#00FFB3] block">Step 1: Domain Auto-Classifier</span>
                <p className="text-slate-400 text-[11px]">Classifies query into Startup, Legal, Tech, or General domain.</p>
              </div>
              <div className="p-3.5 bg-[#14141A] border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#00C8FF] block">Step 2: Parallel 3-Agent Debate</span>
                <p className="text-slate-400 text-[11px]">Executes 3 distinct LLMs in parallel (Gemini + Groq + Llama).</p>
              </div>
              <div className="p-3.5 bg-[#14141A] border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#FF4FD8] block">Step 3: Synthesizer Judge</span>
                <p className="text-slate-400 text-[11px]">Extracts points of agreement/disagreement and outputs core verdict.</p>
              </div>
            </div>
          </section>

          <section className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00FFB3] font-bold text-sm uppercase tracking-wider">
                <Terminal className="w-5 h-5" /> 2. WebSocket Protocol Schema (`/ws/chat`)
              </div>
              <button
                onClick={() => handleCopyCode(`{\n  "type": "user_message",\n  "content": "How should a SaaS pricing model be structured?",\n  "councilId": "auto",\n  "provider": "gemini"\n}`, "ws_code")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-[#14141A] px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                {copiedSection === "ws_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Schema</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Send JSON payloads over WebSocket to trigger parallel debate streaming:
            </p>

            <pre className="bg-[#08080B] p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "type": "user_message",
  "content": "How should a SaaS pricing model be structured?",
  "councilId": "auto",
  "provider": "gemini"
}`}
            </pre>
          </section>

          <section className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
              <Zap className="w-5 h-5" /> 3. Freemium Tier & Rate Limits
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#14141A] border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-xs text-slate-200 uppercase tracking-wider block">Free Plan</span>
                <p className="text-xs text-slate-400">10 queries per day. Access to General Debate Council.</p>
              </div>
              <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-2">
                <span className="font-bold text-xs text-amber-400 uppercase tracking-wider block">PRO Plan</span>
                <p className="text-xs text-slate-300">Unlimited queries. Unlocks Startup & VC, Legal, and Tech Domain Councils.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
