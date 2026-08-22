import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Award,
  PieChart as PieIcon,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  Radio,
  Zap,
  Inbox,
  Home
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
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
  title?: string;
  category: string;
  timestamp: string;
  status: string;
}

interface AnalyticsData {
  isGuest?: boolean;
  hasData?: boolean;
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
    disagreementRate: "0.0%",
    fallbackEventsThisWeek: 0,
    avgLatency: "N/A",
    providerLatencySparkline: [],
    providerReliability: [],
    volumeData: [],
    categoryDistribution: [],
    personaAssignments: [],
    activityFeed: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchAnalytics = () => {
    setIsLoading(true);
    setHasError(false);

    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");

    fetch("/api/ai/analytics", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object") {
          setAnalytics(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load user analytics:", err);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
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
          <h2 className="font-display text-sm text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <BarChart3 className="w-5 h-5 text-[#00FFB3]" /> AI COUNCIL ANALYTICS TELEMETRY
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
              <p className="font-mono text-sm text-[#00C8FF] tracking-widest uppercase">FETCHING REAL-TIME USER TELEMETRY...</p>
            </div>
          ) : hasError ? (
            <div className="py-20 bg-[#14141A] border-2 border-rose-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto shadow-2xl">
              <AlertTriangle className="w-12 h-12 text-rose-400 animate-pulse" />
              <h3 className="font-mono text-lg font-bold text-rose-300">Unable to load analytics right now</h3>
              <p className="text-sm text-slate-400 font-sans">There was a problem querying your session telemetry logs from the database.</p>
              <button
                onClick={fetchAnalytics}
                className="mt-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs px-5 py-2.5 rounded-xl border border-rose-400 shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry Telemetry Query
              </button>
            </div>
          ) : !analytics.hasData && analytics.totalConversations === 0 ? (
            <div className="py-20 bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 bg-[#00FFB3]/10 border border-[#00FFB3]/40 rounded-2xl flex items-center justify-center text-[#00FFB3]">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="font-mono text-lg font-bold text-slate-100">No Analytics Logged Yet</h3>
              <p className="text-sm text-slate-400 font-sans leading-relaxed">
                You haven't run any multi-agent council discussions yet! Start a conversation on the home page to begin tracking real-time category distribution, response latencies, and disagreement telemetry.
              </p>
              <button
                onClick={() => setLocation("/chat")}
                className="mt-3 bg-[#00FFB3] text-[#0B0B0E] font-mono text-xs font-bold px-6 py-3 rounded-xl border-2 border-[#00FFB3] shadow-[4px_4px_0px_#00C8FF] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                Start First Discussion <ChevronRight className="w-4 h-4" />
              </button>
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
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">Total Conversations</span>
                    <div className="font-mono text-3xl font-bold text-[#00FFB3]">{analytics.totalConversations}</div>
                    <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> User Database Logs
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
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">Disagreement Rate</span>
                    <div className="font-mono text-3xl font-bold text-[#FF4FD8]">{analytics.disagreementRate}</div>
                    <span className="text-xs text-pink-400 font-mono font-semibold flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Meaningful Dissent
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
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">Avg Response Latency</span>
                    <div className="font-mono text-3xl font-bold text-[#00C8FF]">{analytics.avgLatency}</div>
                  </div>
                  {analytics.providerLatencySparkline.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800 mt-2">
                      {analytics.providerLatencySparkline.map((item) => (
                        <div key={item.name} className="flex-1 text-center" title={`${item.name}: ${item.latency}`}>
                          <div className="h-2 rounded-full overflow-hidden bg-slate-800 mb-1">
                            <div className="h-full" style={{ width: `${Math.min(100, (item.ms / 2000) * 100)}%`, backgroundColor: item.color }} />
                          </div>
                          <span className="text-xs font-mono text-slate-400 block truncate">{item.name}</span>
                          <span className="text-xs font-mono font-bold text-slate-200 block">{item.latency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* CARD 4: ACTIVE FALLBACK EVENTS THIS WEEK */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">Fallback Events</span>
                    <div className="font-mono text-3xl font-bold text-amber-400">{analytics.fallbackEventsThisWeek}</div>
                    <span className="text-xs text-amber-300 font-mono font-semibold flex items-center gap-1 mt-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Auto-Routed Models
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
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00FFB3]" /> 7-Day Conversation Volume by Domain Category
                  </h3>
                  {analytics.volumeData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.volumeData}>
                          <defs>
                            <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00FFB3" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#00FFB3" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                          <YAxis stroke="#94A3B8" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                          <Area type="monotone" dataKey="queries" name="Daily Queries" stroke="#00FFB3" fill="url(#colorQueries)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center font-mono text-xs text-slate-500">
                      No query volume recorded in the last 7 days.
                    </div>
                  )}
                </div>

                {/* 3. DONUT CHART: CATEGORY DISTRIBUTION */}
                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-[#00C8FF]" /> Category Breakdown
                  </h3>
                  {analytics.categoryDistribution.length > 0 ? (
                    <>
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
                      <div className="space-y-2 pt-2 border-t border-slate-800 max-h-32 overflow-y-auto">
                        {analytics.categoryDistribution.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-300 truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-100">{item.value} queries</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center font-mono text-xs text-slate-500">
                      No categories categorized yet.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. PERSONA ROLE ASSIGNMENTS */}
              {analytics.personaAssignments.length > 0 && (
                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
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
                          <span className="font-bold text-sm text-slate-100 font-mono">{p.persona}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ color: p.color, borderColor: p.color }}>
                            Active Persona
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-sans">
                          Assigned Model: <strong className="text-slate-100 font-mono">{p.model}</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs bg-[#08080B] p-3 rounded-lg border border-slate-800 font-mono">
                          <div>
                            <span className="text-slate-400 block text-xs">Primary Execs</span>
                            <span className="font-bold text-slate-200 text-sm">{p.primaryUses}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-xs">Fallback Count</span>
                            <span className="font-bold text-amber-400 text-sm">{p.fallbacks}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. PROVIDER RELIABILITY MATRIX */}
              {analytics.providerReliability.length > 0 && (
                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> API Provider Reliability & Health Matrix
                    </span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs font-mono">
                          <th className="pb-3">API Provider</th>
                          <th className="pb-3">Average Latency</th>
                          <th className="pb-3">Fallbacks</th>
                          <th className="pb-3">Success Rate %</th>
                          <th className="pb-3">Health Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {analytics.providerReliability.map((row) => (
                          <tr key={row.provider} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 font-mono font-bold flex items-center gap-2 text-sm">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                              {row.provider}
                            </td>
                            <td className="py-3 font-mono text-sm">{row.latencyMs} ms</td>
                            <td className="py-3 font-mono text-amber-400 text-sm">{row.fallbacks} times</td>
                            <td className="py-3 font-mono font-bold text-emerald-400 text-sm">{row.successRate}%</td>
                            <td className="py-3">
                              <span
                                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
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
              )}

              {/* 6. LIVE ACTIVITY FEED */}
              {analytics.activityFeed.length > 0 && (
                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#00FFB3] animate-pulse" /> Live Activity Feed (User Telemetry)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Recent Conversations</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analytics.activityFeed.map((item) => (
                      <div key={item.id} className="p-3.5 bg-[#14141A] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-200 block truncate text-sm mb-0.5">{item.title}</span>
                          <span className="text-xs text-slate-400 block">{item.category} • {item.timestamp}</span>
                        </div>
                        <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-1 rounded font-bold uppercase shrink-0">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
