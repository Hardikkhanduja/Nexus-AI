import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Copy, Sparkles, Check } from "lucide-react";
import { useUsage } from "@/hooks/useUsage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { CouncilSelector } from "@/components/CouncilSelector";
import { ConflictView, ConflictAnalysis } from "@/components/ConflictView";

interface ChatWorkspaceProps {
  onOpenSidebar: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  conflictAnalysis?: ConflictAnalysis;
  createdAt?: string;
}

export default function ChatWorkspace({ onOpenSidebar }: ChatWorkspaceProps) {
  const [, setLocation] = useLocation();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { remaining: localRemaining } = useUsage();

  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<string>("gemini");
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>("auto");
  const [userTier, setUserTier] = useState<"free" | "pro">("free");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState("NEW DISCUSSION");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial tier status
  useEffect(() => {
    fetch("/api/ai/councils")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user_tier) {
          setUserTier(data.user_tier);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleTier = () => {
    const nextTier = userTier === "free" ? "pro" : "free";
    setUserTier(nextTier);
    toast({
      title: `Tier Switched to ${nextTier.toUpperCase()}`,
      description: nextTier === "pro" ? "All Domain Councils Unlocked & Unlimited Queries!" : "Free Tier Active (10 Queries/Day)",
    });
    fetch("/api/user/toggle-tier", { method: "POST" }).catch(() => {});
  };

  // Load conversation history on mount or when conversationId changes
  useEffect(() => {
    if (conversationId && messages.length === 0) {
      setIsLoadingHistory(true);
      const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");
      fetch(`/api/ai/conversations/${conversationId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load conversation");
          return res.json();
        })
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          if (data.title) setConversationTitle(data.title);
        })
        .catch((err) => {
          console.error("Failed to load conversation:", err);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [conversationId]);

  // Auto-send prompt if launched from LandingPage
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("nexus_initial_prompt");
    if (initialPrompt && !conversationId) {
      sessionStorage.removeItem("nexus_initial_prompt");
      const userPrompt = initialPrompt.trim();
      setMessages([
        {
          id: Math.random().toString(),
          role: "user",
          content: userPrompt,
        },
      ]);
      setTimeout(() => {
        sendMessage(userPrompt, undefined, provider, selectedCouncilId);
      }, 400);
    }
  }, [conversationId, provider, selectedCouncilId]);

  // Connect to websocket hook
  const {
    status,
    streamedContent,
    isStreaming,
    activeStances,
    conflictAnalysis: liveConflictAnalysis,
    remaining: wsRemaining,
    sendMessage,
  } = useWebSocket({
    onDebateComplete: (fullText, conflictData, returnedConvId) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: fullText,
          agentName: "Nexus Synthesizer",
          conflictAnalysis: conflictData,
        },
      ]);

      if (returnedConvId) {
        window.history.replaceState(null, "", `/chat/${returnedConvId}`);
        fetch(`/api/ai/conversations/${returnedConvId}/generate-title`, { method: "POST" })
          .then((res) => res.json())
          .then((data) => {
            if (data.title) setConversationTitle(data.title);
          })
          .catch(() => {});
      }
    },
    onError: (msg) => {
      toast({
        title: "Inference Notice",
        description: msg,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent, isStreaming, activeStances]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    const userPrompt = prompt.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        role: "user",
        content: userPrompt,
      },
    ]);

    sendMessage(userPrompt, conversationId, provider, selectedCouncilId);
    setPrompt("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied",
      description: "Content copied to clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const remainingQueries = wsRemaining !== null ? wsRemaining : localRemaining;

  // Custom code renderer for ReactMarkdown
  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div className="my-3 border-2 border-[#333] rounded-xl overflow-hidden shadow-[2px_2px_0px_#000]">
          <div className="bg-[#14141A] px-4 py-2 border-b border-[#333] flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span>{match[1].toUpperCase()}</span>
            <button
              onClick={() => copyToClipboard(String(children).replace(/\n$/, ""), String(children))}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, background: "#08080B" }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-[#08080B] px-1.5 py-0.5 rounded border border-[#333] text-[#00FFB3] font-mono text-xs" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0D0D12]" data-testid="page-chat">
      {/* TOP BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-chat"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-[11px] text-[#00FFB3] tracking-widest mt-1 flex items-center gap-1 truncate">
            {conversationTitle.toUpperCase()}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                |
              </motion.span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={handleToggleTier}
            className={`border-2 rounded-full px-3 py-1 text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              userTier === "pro"
                ? "border-amber-400 text-amber-300 bg-amber-400/10 hover:bg-amber-400/20"
                : "border-secondary text-[#00C8FF] hover:bg-secondary/10"
            }`}
            data-testid="chat-header-query-counter"
          >
            {userTier === "pro" ? "UNLIMITED ⚡" : `${remainingQueries} / 10 queries ⚡`}
          </div>

          <div className="relative flex items-center justify-center w-2 h-2">
            <motion.div
              className={`absolute w-2 h-2 rounded-full ${
                status === "Connected" ? "bg-[#00FF95]" : "bg-[#FF4FD8]"
              }`}
              animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <div
              className={`w-2 h-2 rounded-full relative z-10 ${
                status === "Connected" ? "bg-[#00FF95]" : "bg-[#FF4FD8]"
              }`}
            />
          </div>
        </div>
      </header>

      {/* MESSAGES / CHAT CONTAINER */}
      <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar p-6 bg-[#08080B]">

        {isLoadingHistory ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#00C8FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-display text-[9px] text-[#00C8FF] tracking-widest uppercase">Loading Council Logs...</p>
          </div>
        ) : messages.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-[#00FFB3] flex items-center justify-center text-3xl mb-6 shadow-[4px_4px_0px_#00FFB3]"
            >
              🏛️
            </motion.div>
            <h1 className="font-display text-base text-foreground mb-3 tracking-widest">
              MULTI-AGENT COUNCIL STANDBY
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-sans">
              Select a domain council above or use ✨ Auto-Detect, submit your question, and watch 3 specialized AI agents debate in parallel before synthesizing a final verdict.
            </p>
          </div>
        ) : (
          /* MESSAGE LIST */
          <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className="flex flex-col w-full">
                  <div
                    className={`flex flex-col max-w-[85%] rounded-2xl border-2 p-4 transition-shadow relative ${
                      isUser
                        ? "self-end border-[#00C8FF] bg-[#00C8FF]/5 text-[#E0F7FF] shadow-[3px_3px_0px_rgba(0,200,255,0.2)]"
                        : "self-start border-[#00FFB3] bg-[#00FFB3]/5 text-[#E0FFF6] shadow-[3px_3px_0px_rgba(0,255,179,0.2)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-display text-[9px] uppercase tracking-wider ${
                          isUser ? "text-[#00C8FF]" : "text-[#00FFB3]"
                        }`}
                      >
                        {isUser ? "User Query" : msg.agentName || "Nexus Synthesizer"}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? <Check size={12} className="text-[#00FFB3]" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed break-words">
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>
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

            {/* LIVE DEBATE BUBBLE & THINKING ANIMATION */}
            {isStreaming && (
              <div className="flex flex-col max-w-[90%] rounded-2xl border-2 border-[#FF4FD8] bg-[#FF4FD8]/10 text-[#FFEAF9] shadow-[0_0_20px_rgba(255,79,216,0.25)] p-5 self-start w-full transition-all">
                <div className="flex items-center justify-between mb-3 border-b border-[#FF4FD8]/30 pb-2">
                  <span className="font-mono text-xs text-[#FF4FD8] uppercase tracking-wider flex items-center gap-2 font-bold">
                    <Sparkles size={14} className="animate-spin text-[#00FFB3]" /> 
                    {streamedContent ? "SYNTHESIZING MULTI-AGENT VERDICT..." : "COUNCIL IS THINKING & EVALUATING..."}
                  </span>
                  <span className="text-[10px] font-mono text-[#00FFB3] bg-[#00FFB3]/10 px-2 py-0.5 rounded border border-[#00FFB3]/30 animate-pulse">
                    {status || "CLASSIFYING & QUERYING"}
                  </span>
                </div>

                {/* THINKING ANIMATION STATE */}
                {!streamedContent && activeStances.length === 0 && (
                  <div className="py-4 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#00C8FF] rounded-full animate-ping"></div>
                      <div className="w-3 h-3 bg-[#00FFB3] rounded-full animate-ping" style={{ animationDelay: "200ms" }}></div>
                      <div className="w-3 h-3 bg-[#FF4FD8] rounded-full animate-ping" style={{ animationDelay: "400ms" }}></div>
                    </div>
                    <p className="font-mono text-xs text-slate-300">
                      Querying 3 Council Personas in parallel (<span className="text-[#00C8FF]">Fact-Checker</span>, <span className="text-[#00FFB3]">Optimist</span>, <span className="text-[#FF4FD8]">Skeptic</span>)...
                    </p>
                  </div>
                )}

                {activeStances.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    {activeStances.map((s) => (
                      <div key={s.role_id} className="p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs shadow-inner">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                          <span>{s.icon}</span> {s.role_name}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed">{s.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed break-words">
                  {streamedContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>
                      {streamedContent}
                    </ReactMarkdown>
                  ) : null}
                </div>

                {liveConflictAnalysis && (
                  <ConflictView conflictAnalysis={liveConflictAnalysis} />
                )}
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* STATUS BAR */}
      {status !== "Connected" && status !== "Disconnected" && status !== "Idle" && (
        <div className="bg-[#14141A] border-t border-b border-[#333] px-6 py-1.5 text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FFB3] animate-pulse shrink-0"></span>
          <span>COUNCIL ENGINE STATUS: {status.toUpperCase()}</span>
        </div>
      )}

      {/* BOTTOM INPUT BAR */}
      <footer className="p-5 border-t-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0">
        <div className="max-w-[900px] mx-auto flex flex-col gap-3">
          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1 flex bg-[#08080B] border-[3px] border-primary rounded-xl min-h-[56px] shadow-[4px_4px_0px_#00FFB3] focus-within:shadow-[6px_6px_0px_#00FFB3] transition-shadow">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isStreaming}
                placeholder="Ask the council a complex question..."
                className="w-full bg-transparent border-none outline-none py-4 px-5 text-foreground placeholder:text-primary/40 font-sans text-base focus:ring-0 rounded-xl disabled:opacity-50"
                data-testid="input-chat-prompt"
              />
            </div>
            <button
              type="submit"
              disabled={isStreaming || !prompt.trim()}
              className="w-[56px] h-[56px] shrink-0 bg-[#00FFB3] rounded-xl flex items-center justify-center border-[3px] border-[#00FFB3] shadow-[4px_4px_0px_currentColor] transition-all hover:scale-105 active:scale-95 active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-send-prompt"
            >
              <Send size={24} className="text-[#0B0B0E]" strokeWidth={3} />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
