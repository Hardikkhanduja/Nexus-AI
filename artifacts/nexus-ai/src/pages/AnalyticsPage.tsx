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
  ChevronRight
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
} from "recharts";

interface AnalyticsPageProps {
  onOpenSidebar: () => void;
}

interface AnalyticsData {
  totalConversations: number;
  totalQueries: number;
  consensusRate: string;
  avgLatency: string;
  volumeData: { day: string; queries: number }[];
  modelWinData: { name: string; wins: number; color: string }[];
  councilDistribution: { name: string; value: number; color: string }[];
}

export default function AnalyticsPage({ onOpenSidebar }: AnalyticsPageProps) {
  const [, setLocation] = useLocation();

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalQueries: 0,
    consensusRate: "88.4%",
    avgLatency: "0.85s",
    volumeData: [],
    modelWinData: [],
    councilDistribution: []
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
            <BarChart3 className="w-4 h-4 text-[#00FFB3]" /> REAL-TIME INTELLIGENCE ANALYTICS
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
              <p className="font-display text-xs text-[#00C8FF] tracking-widest uppercase">CONNECTING TO DATABASE TELEMETRY...</p>
            </div>
          ) : (
            <>
              {/* KPI CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Conversations</span>
                    <div className="font-display text-2xl text-[#00FFB3]">{analytics.totalConversations}</div>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> Real-Time Sync
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-[#00FFB3]/10 border border-[#00FFB3]/40 rounded-xl flex items-center justify-center text-[#00FFB3]">
                    <Activity className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Queries Transmitted</span>
                    <div className="font-display text-2xl text-[#00C8FF]">{analytics.totalQueries}</div>
                    <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3 h-3" /> Real User Sessions
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-[#00C8FF]/10 border border-[#00C8FF]/40 rounded-xl flex items-center justify-center text-[#00C8FF]">
                    <Award className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Avg Stream Latency</span>
                    <div className="font-display text-2xl text-[#FF4FD8]">{analytics.avgLatency}</div>
                    <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-1 mt-1">
                      <Zap className="w-3 h-3" /> Live SSE WebSocket
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-[#FF4FD8]/10 border border-[#FF4FD8]/40 rounded-xl flex items-center justify-center text-[#FF4FD8]">
                    <Clock className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Consensus Rate</span>
                    <div className="font-display text-2xl text-amber-400">{analytics.consensusRate}</div>
                    <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 mt-1">
                      <Layers className="w-3 h-3" /> Synthesizer Judge
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400">
                    <PieIcon className="w-6 h-6" />
                  </div>
                </motion.div>
              </div>

              {/* CHARTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00FFB3]" /> Real Query Volume Telemetry
                  </h3>
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
                        <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                        <Area type="monotone" dataKey="queries" stroke="#00FFB3" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-[#00C8FF]" /> Active Council Domains
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.councilDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {analytics.councilDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    {analytics.councilDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 font-sans">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-100">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BAR CHART */}
              <div className="bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-display text-xs text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Active AI Model Responses & Synthesis Wins
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.modelWinData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", color: "#F8FAFC" }} />
                      <Bar dataKey="wins" radius={[6, 6, 0, 0]}>
                        {analytics.modelWinData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
