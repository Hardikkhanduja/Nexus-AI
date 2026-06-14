import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, AlertTriangle, Sparkles, Check } from "lucide-react";
import { useUsage } from "@/hooks/useUsage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatWorkspaceProps {
  onOpenSidebar: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  createdAt?: string;
}

export default function ChatWorkspace({ onOpenSidebar }: ChatWorkspaceProps) {
  const [, setLocation] = useLocation();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { remaining: localRemaining, usage } = useUsage();

  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState("NEW CONVERSATION");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount or when conversationId changes
  useEffect(() => {
    if (conversationId && isAuthenticated) {
      setIsLoadingHistory(true);
      const token = localStorage.getItem("nexus_token");
      fetch(`/api/ai/conversations/${conversationId}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load conversation");
          return res.json();
        })
        .then((data) => {
          setMessages(data.messages || []);
          setConversationTitle(data.title || "CONVERSATION");
        })
        .catch((err) => {
          console.error("Failed to load conversation:", err);
          toast({
            title: "Error",
            description: "Could not load conversation history.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      setMessages([]);
      setConversationTitle("NEW CONVERSATION");
    }
  }, [conversationId, isAuthenticated, toast]);

  // Connect to websocket
  const {
    status,
    streamedContent,
    isStreaming,
    remaining: wsRemaining,
    limit: wsLimit,
    error: wsError,
    sendMessage,
  } = useWebSocket({
    onCompleted: (content, returnedConvId, title) => {
      // Append assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content,
          agentName: provider === "openai" ? "GPT" : "Claude",
        },
      ]);
      setConversationTitle(title);

      // Redirect if this was a new conversation
      if (!conversationId) {
        setLocation(`/chat/${returnedConvId}`);
      }
    },
    onError: (msg) => {
      toast({
        title: "Inference Error",
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
  }, [messages, streamedContent, isStreaming]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // Optimistically add user message
    const userPrompt = prompt.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        role: "user",
        content: userPrompt,
      },
    ]);

    // Send via websocket
    sendMessage(userPrompt, conversationId, provider);
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
  const queryLimit = wsLimit !== null ? wsLimit : (usage?.dailyQueryLimit ?? (isAuthenticated ? 30 : 5));

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
              <Copy size={12} />
              Copy
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
            onClick={() => setLocation("/usage")}
            className="border-2 border-secondary rounded-full px-3 py-1 text-xs text-[#00C8FF] font-sans font-bold flex items-center gap-1 cursor-pointer hover:bg-secondary/10 transition-colors"
            data-testid="chat-header-query-counter"
          >
            {remainingQueries} queries ⚡
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
            <p className="font-display text-[9px] text-[#00C8FF] tracking-widest uppercase">Initializing logs...</p>
          </div>
        ) : messages.length === 0 ? (
          /* EMPTY STATE (AWAITING PROMPT) */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-[#00FFB3] flex items-center justify-center text-3xl mb-6 shadow-[4px_4px_0px_#00FFB3]"
            >
              🤖
            </motion.div>
            <h1 className="font-display text-base text-foreground mb-3 tracking-widest">
              SYSTEM STANDBY
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8 font-sans">
              Nexus AI core inference pipeline is active. Select your preferred LLM provider, supply a context vector, and initiate the query sequence.
            </p>

            {/* PRE-SELECT AGENT CARDS */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => setProvider("openai")}
                className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden group ${
                  provider === "openai"
                    ? "border-[#00C8FF] bg-[#00C8FF]/5 shadow-[3px_3px_0px_#00C8FF]"
                    : "border-[#333] bg-[#14141A]/50 hover:border-[#555]"
                }`}
              >
                <div className="font-display text-[9px] text-[#00C8FF] mb-1">GPT-4O</div>
                <div className="font-sans text-[10px] text-muted-foreground">Fast, reasoning-heavy models.</div>
              </button>
              <button
                onClick={() => setProvider("anthropic")}
                className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden group ${
                  provider === "anthropic"
                    ? "border-[#FF4FD8] bg-[#FF4FD8]/5 shadow-[3px_3px_0px_#FF4FD8]"
                    : "border-[#333] bg-[#14141A]/50 hover:border-[#555]"
                }`}
              >
                <div className="font-display text-[9px] text-[#FF4FD8] mb-1">CLAUDE-3.5</div>
                <div className="font-sans text-[10px] text-muted-foreground">Nuanced creative output.</div>
              </button>
            </div>
          </div>
        ) : (
          /* MESSAGE LIST */
          <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
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
                      {isUser ? "User" : msg.agentName || "Agent"}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-[#00FFB3]" />
                        ) : (
                          <Copy size={12} />
                        )}
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
              );
            })}

            {/* LIVE STREAMING RESPONSE BUBBLE */}
            {isStreaming && (
              <div className="flex flex-col max-w-[85%] rounded-2xl border-2 border-[#FF4FD8] bg-[#FF4FD8]/5 text-[#FFEAF9] shadow-[3px_3px_0px_rgba(255,79,216,0.2)] p-4 self-start">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-[9px] text-[#FF4FD8] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={10} className="animate-pulse" />
                    {provider === "openai" ? "GPT" : "Claude"} Response Streaming...
                  </span>
                </div>
                <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed break-words">
                  {streamedContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>
                      {streamedContent}
                    </ReactMarkdown>
                  ) : (
                    /* Pulsing Cursor */
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 bg-[#FF4FD8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-[#FF4FD8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-[#FF4FD8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  )}
                </div>
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
          <span>SYSTEM STATUS: {status.toUpperCase()}</span>
        </div>
      )}

      {/* BOTTOM INPUT BAR */}
      <footer className="p-5 border-t-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0">
        <div className="max-w-[900px] mx-auto flex flex-col gap-3">
          {/* Provider selector for active discussions */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 self-start bg-[#08080B] border border-[#333] rounded-lg p-1 text-[10px]">
              <span className="text-muted-foreground px-2">PROVIDER:</span>
              <button
                onClick={() => setProvider("openai")}
                disabled={isStreaming}
                className={`px-3 py-1 rounded font-display text-[9px] cursor-pointer transition-colors ${
                  provider === "openai"
                    ? "bg-[#00C8FF] text-[#08080B]"
                    : "text-[#00C8FF] hover:bg-white/5"
                }`}
              >
                GPT
              </button>
              <button
                onClick={() => setProvider("anthropic")}
                disabled={isStreaming}
                className={`px-3 py-1 rounded font-display text-[9px] cursor-pointer transition-colors ${
                  provider === "anthropic"
                    ? "bg-[#FF4FD8] text-[#08080B]"
                    : "text-[#FF4FD8] hover:bg-white/5"
                }`}
              >
                CLAUDE
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1 flex bg-[#08080B] border-[3px] border-primary rounded-xl min-h-[56px] shadow-[4px_4px_0px_#00FFB3] focus-within:shadow-[6px_6px_0px_#00FFB3] transition-shadow">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isStreaming}
                placeholder="Initialize command sequence..."
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