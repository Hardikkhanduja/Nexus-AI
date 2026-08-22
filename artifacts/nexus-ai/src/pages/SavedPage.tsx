import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  Bookmark,
  Search,
  Copy,
  Check,
  Trash2,
  ChevronRight,
  Tag,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedPageProps {
  onOpenSidebar: () => void;
}

interface SavedSynthesis {
  id: string;
  title: string;
  category: "Startup" | "Legal" | "Tech" | "General";
  verdict: string;
  keyTakeaways: string[];
  savedAt: string;
}

const INITIAL_SAVED: SavedSynthesis[] = [
  {
    id: "saved_1",
    title: "CGPA & Placement Strategy for Tier-3 IT Students",
    category: "Tech",
    verdict: "Maintain an 8.0+ CGPA to clear automated ATS screening filters, then focus 70% of effort on practical DSA and portfolio projects.",
    keyTakeaways: [
      "8.0 CGPA is the definitive safety cutoff for 90%+ of campus drives",
      "Off-campus recruitment and open-source contributions equalize college tier gaps",
      "High GPA alone without projects fails technical rounds"
    ],
    savedAt: "2026-08-22"
  },
  {
    id: "saved_2",
    title: "SaaS Pricing & PLG vs Enterprise Sales Matrix",
    category: "Startup",
    verdict: "Adopt a hybrid PLG motion for self-serve signups under $5k ACV, with dedicated enterprise sales reps for contract sizes exceeding $25k ACV.",
    keyTakeaways: [
      "PLG achieves lower CAC payback periods (< 8 months)",
      "Enterprise sales required for SOC-2 compliance & custom security SLAs",
      "Self-serve tier creates viral top-of-funnel lead generation"
    ],
    savedAt: "2026-08-21"
  }
];

export default function SavedPage({ onOpenSidebar }: SavedPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [savedItems, setSavedItems] = useState<SavedSynthesis[]>(INITIAL_SAVED);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied", description: "Synthesis verdict copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed", description: "Saved synthesis removed." });
  };

  const filteredItems = savedItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verdict.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-saved">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-saved"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            <Bookmark className="w-4 h-4 text-[#00FFB3]" /> SAVED INSIGHTS & VERDICTS
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-3.5 py-1.5 rounded-xl border-[2px] border-[#00FFB3] shadow-[2px_2px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          >
            New Debate <ChevronRight className="w-4 h-4" />
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
          <div className="bg-[#0D0D12] border-2 border-slate-800 p-4 rounded-xl shadow-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved verdicts by keyword..."
              className="w-full bg-[#14141A] border border-slate-700 focus:border-[#00FFB3] outline-none rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 font-sans transition-all"
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-display text-sm text-slate-200 uppercase tracking-wider mb-2">No Bookmarks Found</h3>
              <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
                Bookmark key synthesizer verdicts during chat sessions to save them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0D0D12] border-2 border-slate-800 hover:border-[#00FFB3] rounded-2xl p-5 shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" /> {item.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">Saved {item.savedAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopy(item.verdict, item.id, e)}
                          className="p-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Verdict"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove Bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-sans font-bold text-base text-slate-100 mb-3">
                      {item.title}
                    </h3>

                    <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/50 rounded-xl mb-4 text-xs text-indigo-200 leading-relaxed font-medium">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                        Synthesized Core Verdict
                      </span>
                      {item.verdict}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Key Takeaways
                      </span>
                      {item.keyTakeaways.map((point, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 font-sans">
                          <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 fill-amber-400/20" />
                          <span>{point}</span>
                        </div>
                      ))}
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
