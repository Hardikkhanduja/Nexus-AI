import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ConflictView from "@/components/ConflictView";
import { 
  Share2, Landmark, Copy, Check, Plus, ArrowRight 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageItem {
  id: string;
  role: string;
  content: string;
  agentName?: string;
  conflictAnalysis?: any;
  createdAt?: string;
}

export default function SharePage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("Shared Multi-Agent Discussion");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);
    setHasError(false);

    fetch(`/api/ai/shared/${conversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Conversation not found");
        return res.json();
      })
      .then((data) => {
        setTitle(data.title || "Shared Discussion");
        setMessages(data.messages || []);
      })
      .catch((err) => {
        console.error("Failed to load shared discussion:", err);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast({
      title: "Link Copied!",
      description: "Public discussion link copied to clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Response text copied to clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-share">
      {/* TOP HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div 
            onClick={() => setLocation("/")} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <h1 className="font-display text-sm tracking-widest">
              <span className="text-[#00FFB3]">NEXUS</span> <span className="text-[#FF4FD8]">AI</span>
            </h1>
          </div>
          <span className="text-xs bg-[#00FFB3]/10 border border-[#00FFB3]/40 text-[#00FFB3] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider hidden sm:inline-flex items-center gap-1">
            <Share2 className="w-3 h-3" /> SHARED DEBATE LOG
          </span>
          <h2 className="font-display text-xs text-[#00C8FF] tracking-widest uppercase truncate max-w-[min(45vw,400px)]">
            {title.toUpperCase()}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyLink}
            className="p-2 border-2 border-[#00C8FF]/50 rounded-lg hover:border-[#00C8FF] bg-[#14141A] text-[#00C8FF] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            data-testid="button-copy-share-link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#00FFB3]" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? "COPIED" : "SHARE LINK"}</span>
          </button>

          <button
            onClick={() => setLocation("/chat")}
            className="bg-[#00FFB3] text-[#0B0B0E] font-sans font-bold px-4 py-2 rounded-xl border-[2px] border-[#00FFB3] shadow-[3px_3px_0px_#00C8FF] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            data-testid="button-try-nexus"
          >
            <Plus className="w-4 h-4" /> Try Nexus AI
          </button>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#08080B]">
        <div className="max-w-[min(92vw,1150px)] mx-auto space-y-6">
          
          {/* BANNER NOTIFICATION */}
          <div className="bg-[#14141A] border-2 border-[#00FFB3]/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FFB3]/10 border border-[#00FFB3] flex items-center justify-center text-[#00FFB3] shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-xs text-[#00FFB3] uppercase tracking-wider font-bold">
                  Shared Multi-Agent Council Verdict
                </h3>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  You are viewing a shared read-only transcript of a 3-agent adversarial debate executed on Nexus AI.
                </p>
              </div>
            </div>

            <button
              onClick={() => setLocation("/chat")}
              className="bg-[#00C8FF] text-[#0D0D12] font-mono text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#00C8FF] hover:bg-[#00C8FF]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              Start New Debate <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* MESSAGE LIST */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-[#00FFB3] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-xs text-[#00FFB3] tracking-widest uppercase">Fetching Shared Debate Logs...</p>
            </div>
          ) : hasError || messages.length === 0 ? (
            <div className="py-20 text-center bg-[#0D0D12] border-2 border-slate-800 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl space-y-4">
              <h3 className="font-display text-sm text-rose-400 uppercase tracking-wider">Discussion Not Found</h3>
              <p className="text-xs text-slate-400 font-sans">This shared link may have expired or does not exist.</p>
              <button
                onClick={() => setLocation("/chat")}
                className="bg-[#00FFB3] text-[#0D0D12] font-sans font-bold px-5 py-2.5 rounded-xl border-2 border-[#00FFB3] shadow-[3px_3px_0px_#00C8FF] hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer text-xs"
              >
                Launch Multi-Agent Council <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className="flex flex-col w-full">
                    <div
                      className={`flex flex-col max-w-[92%] rounded-2xl border-2 p-5 lg:p-6 transition-shadow relative ${
                        isUser
                          ? "self-end border-[#00C8FF] bg-[#00C8FF]/5 text-[#E0F7FF] shadow-[3px_3px_0px_rgba(0,200,255,0.2)]"
                          : "self-start border-[#00FFB3] bg-[#00FFB3]/5 text-[#E0FFF6] shadow-[3px_3px_0px_rgba(0,255,179,0.2)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <span
                          className={`font-mono text-xs font-bold uppercase tracking-wider ${
                            isUser ? "text-[#00C8FF]" : "text-[#00FFB3]"
                          }`}
                        >
                          {isUser ? "User Prompt" : msg.agentName || "Nexus Synthesizer"}
                        </span>
                        {!isUser && (
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy Response"
                          >
                            {copiedId === msg.id ? <Check size={14} className="text-[#00FFB3]" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed break-words prose-p:text-sm prose-li:text-sm prose-td:text-sm prose-th:text-sm prose-blockquote:text-sm">
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>

                    {!isUser && msg.conflictAnalysis && (
                      <ConflictView conflictAnalysis={msg.conflictAnalysis} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
