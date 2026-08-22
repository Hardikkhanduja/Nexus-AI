import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Scale, ChevronDown, ChevronUp, UserCheck, BrainCircuit, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface AgentResponse {
  role_id: string;
  role_name: string;
  stance: string;
  icon: string;
  provider_used?: string;
  content: string;
}

export interface ConflictAnalysis {
  agents?: AgentResponse[];
  points_of_agreement?: string[];
  points_of_disagreement?: string[];
  verdict_summary?: string;
}

interface ConflictViewProps {
  conflictAnalysis: ConflictAnalysis;
}

export const ConflictView: React.FC<ConflictViewProps> = ({ conflictAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showThoughts, setShowThoughts] = useState(false);

  const agents = conflictAnalysis.agents || [];
  const agreements = conflictAnalysis.points_of_agreement || [];
  const disagreements = conflictAnalysis.points_of_disagreement || [];
  const verdict = conflictAnalysis.verdict_summary;

  if (agents.length === 0 && agreements.length === 0 && disagreements.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-4 bg-slate-950/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* TOGGLE BAR */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-[#14141A] border border-indigo-500/40 hover:border-indigo-400 p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-md group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            Council Perspectives & Conflict Analysis
          </span>
          <span className="text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full font-medium">
            3 LLMs Evaluated
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <span>{isExpanded ? "Hide Summary" : "Show Summary"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-slate-200 text-sm">
          {/* Judge Verdict Card */}
          {verdict && (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/60 rounded-lg text-indigo-200 flex items-start gap-3 shadow-inner">
              <UserCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  Synthesizer Judge Core Verdict
                </span>
                <p className="text-xs leading-relaxed text-indigo-100 font-medium">{verdict}</p>
              </div>
            </div>
          )}

          {/* Agreement vs Disagreement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Points of Agreement */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Points of Agreement
              </div>
              <ul className="space-y-1.5">
                {agreements.map((item, idx) => (
                  <li key={idx} className="text-xs text-emerald-200/90 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contested Points */}
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Contested Points & Disagreements
              </div>
              <ul className="space-y-1.5">
                {disagreements.map((item, idx) => (
                  <li key={idx} className="text-xs text-rose-200/90 flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 🧠 COLLAPSIBLE MODEL THOUGHTS DROPDOWN */}
          {agents.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowThoughts(!showThoughts)}
                className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-lg flex items-center justify-between text-xs text-slate-200 font-semibold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Inspect Underlying 3 LLM Model Thoughts</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                    Gemini • Groq • Llama
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span>{showThoughts ? "Hide Thoughts" : "Expand Thoughts"}</span>
                  {showThoughts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Model Thought Tabs */}
              {showThoughts && (
                <div className="mt-3 p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                  <Tabs defaultValue={agents[0]?.role_id || "0"} className="w-full">
                    <TabsList className="bg-slate-950 border border-slate-800 p-1 w-full justify-start overflow-x-auto">
                      {agents.map((agent) => (
                        <TabsTrigger
                          key={agent.role_id}
                          value={agent.role_id}
                          className="text-xs gap-1.5 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100"
                        >
                          <span>{agent.icon}</span>
                          <span>{agent.role_name}</span>
                          {agent.provider_used && (
                            <span className="text-[9px] opacity-75 bg-slate-900 px-1 rounded">
                              {agent.provider_used}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {agents.map((agent) => (
                      <TabsContent
                        key={agent.role_id}
                        value={agent.role_id}
                        className="p-3.5 mt-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-2"
                      >
                        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {agent.icon} {agent.role_name} Stance
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                              Provider: {agent.provider_used || "AI"}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              {agent.stance}
                            </span>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-200">
                          {agent.content}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
