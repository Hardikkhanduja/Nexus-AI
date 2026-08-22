import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  Award,
  Layers,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Rocket,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Radio
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

interface AnalyticsPageProps {
  onOpenSidebar: () => void;
}

interface ProviderSparkline {
  name: string;
  latency: string;
  ms: number;
  color: string;
}

interface ProviderReliability {
  provider: string;
  latencyMs: number;
  fallbacks: number;
  successRate: number;
  status: "Optimal" | "Active" | "Weak Link";
  color: string;
}

interface PersonaAssignment {
  persona: string;
  model: string;
  primaryUses: number;
  fallbacks: number;
  color: string;
}

interface ActivityItem {
  id: string;
  category: string;
  timestamp: string;
  status: string;
}

interface AnalyticsData {
  totalConversations: number;
  totalQueries: number;
  disagreementRate: string;
  fallbackEventsThisWeek: number;
  avgLatency: string;
  providerLatencySparkline: ProviderSparkline[];
  providerReliability: ProviderReliability[];
  volumeData: any[];
  categoryDistribution: { name: string; value: number; color: string }[];
  personaAssignments: PersonaAssignment[];
  activityFeed: ActivityItem[];
}

export default function AnalyticsPage({ onOpenSidebar }: AnalyticsPageProps) {
  const [, setLocation] = useLocation();

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalQueries: 0,
    disagreementRate: "42.8%",
    fallbackEventsThisWeek: 3,
    avgLatency: "0.85s",
    providerLatencySparkline: [
      { name: "Groq", latency: "0.28s", ms: 280, color: "#00FFB3" },
      { name: "Gemini", latency: "0.65s", ms: 650, color: "#00C8FF" },
      { name: "Claude", latency: "1.12s", ms: 1120, color: "#FF4FD8" },
      { name: "GPT-4o", latency: "0.95s", ms: 950, color: "#F59E0B" }
    ],
    providerReliability: [],
    volumeData: [],
    categoryDistribution: [],
    personaAssignments: [],
    activityFeed: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");

    fetch("/api/ai/analytics", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setAnalytics(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load real-time analytics:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-analytics">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-analytics"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <BarChart3 className="w-4 h-4 text-[#00FFB3]" /> AI COUNCIL ANALYTICS TELEMETRY
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
              <p className="font-display text-xs text-[#00C8FF] tracking-widest uppercase">FETCHING REAL-TIME COUNCIL LOGS...</p>
            </div>
          ) : (
            <>
              {/* 1. TOP STAT CARDS (4 REWORKED CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: TOTAL CONVERSATIONS RUN */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Conversations Run</span>
                    <div className="font-display text-2xl text-[#00FFB3]">{analytics.totalConversations}</div>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> Live DB Logs
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-[#00FFB3]/10 border border-[#00FFB3]/40 rounded-xl flex items-center justify-center text-[#00FFB3]">
                    <Activity className="w-6 h-6" />
                  </div>
                </motion.div>

                {/* CARD 2: PERSONA DISAGREEMENT RATE */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Persona Disagreement Rate</span>
                    <div className="font-display text-2xl text-[#FF4FD8]">{analytics.disagreementRate}</div>
                    <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3 h-3" /> Meaningful Dissent
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-[#FF4FD8]/10 border border-[#FF4FD8]/40 rounded-xl flex items-center justify-center text-[#FF4FD8]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </motion.div>

                {/* CARD 3: AVG LATENCY WITH PROVIDER SPARKLINE */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Avg Response Latency</span>
                    <div className="font-display text-2xl text-[#00C8FF]">{analytics.avgLatency}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 mt-2">
                    {analytics.providerLatencySparkline.map((item) => (
                      <div key={item.name} className="flex-1 text-center" title={`${item.name}: ${item.latency}`}>
                        <div className="h-1.5 rounded-full overflow-hidden bg-slate-800 mb-1">
                          <div className="h-full" style={{ width: `${Math.min(100, (item.ms / 1500) * 100)}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 block">{item.name}</span>
                        <span className="text-[9px] font-bold text-slate-200 block">{item.latency}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* CARD 4: ACTIVE FALLBACK EVENTS THIS WEEK */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Active Fallback Events</span>
                    <div className="font-display text-2xl text-amber-400">{analytics.fallbackEventsThisWeek}</div>
                    <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 mt-1">
                      <RefreshCw className="w-3 h-3" /> Auto-Routed to Backup
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                </motion.div>
              </div>

              {/* 2. STACKED 7-DAY VOLUME & 3. DOMAIN DONUT CHART */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-DAY STACKED CATEGORY VOLUME */}
                <div className="lg:col-span-2 bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00FFB3]" /> 7-Day Conversation Volume by Domain Category
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.volumeData}>
                        <defs>
                          <linearGradient id="colorCoding" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00FFB3" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#00FFB3" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorBusiness" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                        <Area type="monotone" dataKey="coding" name="Coding & Programming" stackId="1" stroke="#00FFB3" fill="url(#colorCoding)" />
                        <Area type="monotone" dataKey="business" name="Business & Strategy" stackId="1" stroke="#00C8FF" fill="url(#colorBusiness)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. DONUT CHART: 13 CATEGORY DISTRIBUTION */}
                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-[#00C8FF]" /> Category Distribution (13 Domains)
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {analytics.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 max-h-28 overflow-y-auto custom-scrollbar">
                    {analytics.categoryDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 font-sans truncate">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-100">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. PERSONA ROLE & MODEL ASSIGNMENTS */}
              <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Persona Role Assignments & Model Executions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.personaAssignments.map((p) => (
                    <div
                      key={p.persona}
                      className="p-4 rounded-xl border bg-[#14141A] space-y-3"
                      style={{ borderColor: `${p.color}50` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100">{p.persona}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ color: p.color, borderColor: p.color }}>
                          Active Persona
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-sans">
                        Assigned Model: <strong className="text-slate-100">{p.model}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#08080B] p-2.5 rounded-lg border border-slate-800 font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px]">Primary Execs</span>
                          <span className="font-bold text-slate-200">{p.primaryUses}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Fallback Count</span>
                          <span className="font-bold text-amber-400">{p.fallbacks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. PROVIDER RELIABILITY & HEALTH MATRIX */}
              <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> API Provider Reliability & Health Matrix
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Weakest Link Flagged
                  </span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                        <th className="pb-3">API Provider</th>
                        <th className="pb-3">Average Latency</th>
                        <th className="pb-3">Fallbacks (This Week)</th>
                        <th className="pb-3">Success Rate %</th>
                        <th className="pb-3">Health Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {analytics.providerReliability.map((row) => (
                        <tr key={row.provider} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                            {row.provider}
                          </td>
                          <td className="py-3 font-mono">{row.latencyMs} ms</td>
                          <td className="py-3 font-mono text-amber-400">{row.fallbacks} times</td>
                          <td className="py-3 font-mono font-bold text-emerald-400">{row.successRate}%</td>
                          <td className="py-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                row.status === "Weak Link"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. LIVE ACTIVITY FEED */}
              <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#00FFB3] animate-pulse" /> Live Activity Feed (Anonymized Telemetry)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Last 10-15 Conversations</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analytics.activityFeed.map((item) => (
                    <div key={item.id} className="p-3 bg-[#14141A] border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block mb-0.5">{item.category}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
