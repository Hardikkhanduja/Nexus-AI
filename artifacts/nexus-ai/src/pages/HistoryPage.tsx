import React, { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { SafeSignedIn as SignedIn, SafeSignedOut as SignedOut, SafeUserButton as UserButton } from "@/lib/clerk";
import {
  Search,
  MessageSquare,
  Clock,
  Trash2,
  ExternalLink,
  Sparkles,
  Plus,
  Scale,
  Rocket,
  Cloud,
  Layers,
  ChevronRight,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HistoryPageProps {
  onOpenSidebar: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  council?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function HistoryPage({ onOpenSidebar }: HistoryPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCouncilFilter, setSelectedCouncilFilter] = useState("all");

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");
    
    fetch(getApiUrl("/api/ai/conversations"), {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          setConversations([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: "Discussion Removed",
      description: "Conversation removed from local cache.",
    });
  };

  const filteredConversations = conversations.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCouncil =
      selectedCouncilFilter === "all" ||
      (item.council && item.council.toLowerCase() === selectedCouncilFilter.toLowerCase());
    return matchesSearch && matchesCouncil;
  });

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-history">
      {/* TOP HEADER BAR (MATCHES HOME & CHATWORKSPACE) */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-history"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <MessageSquare className="w-4 h-4 text-[#00FFB3]" /> DISCUSSION ARCHIVES
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-3.5 py-1.5 rounded-xl border-[2px] border-[#00FFB3] shadow-[2px_2px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" /> New Discussion
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
          {/* SEARCH AND FILTER BAR */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-[#0D0D12] border-2 border-slate-800 p-4 rounded-xl shadow-lg">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions by title or query..."
                className="w-full bg-[#14141A] border border-slate-700 focus:border-[#00FFB3] outline-none rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 font-sans transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "All Archives", icon: Layers },
                { id: "general", label: "General", icon: Sparkles },
                { id: "startup", label: "Startup", icon: Rocket },
                { id: "legal", label: "Legal", icon: Scale },
                { id: "tech", label: "Tech", icon: Cloud },
              ].map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedCouncilFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedCouncilFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20"
                        : "bg-[#14141A] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT GRID */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-[#00C8FF] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-display text-xs text-[#00C8FF] tracking-widest uppercase">Fetching Conversation Logs...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 text-center bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl">
              <div className="w-14 h-14 bg-indigo-950/50 border-2 border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-[4px_4px_0px_#4F46E5]">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-display text-sm text-slate-200 uppercase tracking-wider mb-2">No Discussion Archives Found</h3>
              <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
                {searchQuery ? "No discussions match your active search terms." : "You haven't initiated any multi-agent council debates yet."}
              </p>
              <button
                onClick={() => setLocation("/chat")}
                className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-5 py-2.5 rounded-xl border-[3px] border-[#00FFB3] shadow-[3px_3px_0px_#00C8FF] hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer text-xs"
              >
                Start Your First Conversation <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredConversations.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setLocation(`/chat/${item.id}`)}
                    className="bg-[#0D0D12] border-2 border-slate-800 hover:border-[#00FFB3] rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[4px_4px_0px_#00FFB3] group relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] bg-slate-900 border border-slate-700 text-indigo-300 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" /> Multi-Agent Conversation
                        </span>

                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-slate-800"
                          title="Delete Discussion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-sans font-bold text-sm text-slate-100 group-hover:text-[#00FFB3] transition-colors line-clamp-2 mb-4">
                        {item.title || "Untitled Discussion"}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#00C8FF] group-hover:translate-x-1 transition-transform font-semibold">
                        <span>Resume Chat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
