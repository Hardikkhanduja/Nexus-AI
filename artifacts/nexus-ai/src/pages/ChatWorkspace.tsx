import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface ChatWorkspaceProps {
  onOpenSidebar: () => void;
}

const agents = [
  { name: "GPT", emoji: "🤖", color: "#00C8FF" },
  { name: "Claude", emoji: "🧠", color: "#FF4FD8" },
  { name: "Gemini", emoji: "✨", color: "#00FFB3" }
];

export default function ChatWorkspace({ onOpenSidebar }: ChatWorkspaceProps) {
  const [prompt, setPrompt] = useState("");
  const [activeMode, setActiveMode] = useState<"auto" | "manual">("auto");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPrompt("");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative" data-testid="page-chat">
      {/* TOP BAR */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-background"
            data-testid="button-open-sidebar-chat"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest mt-1 flex items-center gap-1">
            NEW CONVERSATION
            <motion.span 
              animate={{ opacity: [1, 0, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
            >
              |
            </motion.span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-2 border-secondary rounded-full px-3 py-1 text-sm text-[#00C8FF] font-sans font-bold flex items-center gap-1">
            28 queries ⚡
          </div>
          <div className="relative flex items-center justify-center w-2 h-2">
            <motion.div 
              className="absolute w-2 h-2 bg-[#00FF95] rounded-full"
              animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <div className="w-2 h-2 bg-[#00FF95] rounded-full relative z-10" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar pt-4 pb-12">
        {/* MODE TOGGLE */}
        <div className="flex justify-center gap-4 my-4">
          <button
            onClick={() => setActiveMode("auto")}
            className={`rounded-full px-6 py-2.5 font-sans font-bold text-sm transition-all flex items-center gap-2 ${
              activeMode === "auto" 
                ? 'bg-[#00FFB3] text-[#0B0B0E] border-[3px] border-[#00FFB3] shadow-[3px_3px_0px_rgba(0,0,0,0.5)]'
                : 'bg-[#14141A] text-[#555] border-[3px] border-[#333]'
            }`}
          >
            ⚡ AUTO
          </button>
          <button
            onClick={() => setActiveMode("manual")}
            className={`rounded-full px-6 py-2.5 font-sans font-bold text-sm transition-all flex items-center gap-2 ${
              activeMode === "manual" 
                ? 'bg-[#00FFB3] text-[#0B0B0E] border-[3px] border-[#00FFB3] shadow-[3px_3px_0px_rgba(0,0,0,0.5)]'
                : 'bg-[#14141A] text-[#555] border-[3px] border-[#333]'
            }`}
          >
            ⚙️ MANUAL
          </button>
        </div>

        {/* AGENT CARDS */}
        <div className="flex flex-row gap-6 px-6 flex-wrap justify-center mt-6">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * (i + 1), type: "spring" }}
              whileHover={{ rotate: 2, scale: 1.02 }}
              className="flex-1 min-w-[240px] max-w-[300px] bg-[#14141A] border-[3px] rounded-2xl p-5 flex flex-col items-center relative"
              style={{ borderColor: agent.color }}
              data-testid={`card-agent-${agent.name.toLowerCase()}`}
            >
              <motion.div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{ boxShadow: [`4px 4px 0px ${agent.color}`, `6px 6px 0px ${agent.color}`, `4px 4px 0px ${agent.color}`] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <h3 className="font-display text-[10px] mb-3 z-10" style={{ color: agent.color }}>{agent.name}</h3>
              
              <div 
                className="w-[52px] h-[52px] rounded-full border-2 flex items-center justify-center text-3xl z-10"
                style={{ backgroundColor: `${agent.color}33`, borderColor: agent.color }}
              >
                {agent.emoji}
              </div>
              
              <div className="mt-3 flex items-center gap-2 z-10">
                <motion.div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: agent.color }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="font-sans text-xs text-[#555] font-bold tracking-wide">STANDING BY...</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SYNTHESIS PANEL */}
        <div 
          className="mx-6 mt-10 max-w-[920px] w-full self-center bg-[#14141A] border-[3px] border-[#FF4FD8] rounded-2xl p-5 shadow-[4px_4px_0px_#FF4FD8]"
          data-testid="card-synthesis"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#FF4FD8] text-[10px]">♦</span>
            <h3 className="font-display text-[10px] text-[#FF4FD8] tracking-widest mt-1">NEXUS SYNTHESIS</h3>
          </div>
          <motion.div 
            className="border-2 border-dashed border-accent/30 rounded-xl p-6 flex items-center justify-center min-h-[120px]"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="font-sans text-sm text-[#555] font-bold tracking-wide">AWAITING AGENT OUTPUTS...</span>
          </motion.div>
        </div>
      </main>

      {/* BOTTOM INPUT BAR */}
      <footer className="p-5 border-t-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0">
        <form onSubmit={handleSend} className="max-w-[900px] mx-auto flex gap-3">
          <div className="flex-1 flex bg-[#08080B] border-[3px] border-primary rounded-xl min-h-[56px] shadow-[4px_4px_0px_#00FFB3] focus-within:shadow-[6px_6px_0px_#00FFB3] transition-shadow">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Initialize command sequence..."
              className="w-full bg-transparent border-none outline-none py-4 px-5 text-foreground placeholder:text-primary/40 font-sans text-base focus:ring-0 rounded-xl"
              data-testid="input-chat-prompt"
            />
          </div>
          <button 
            type="submit"
            className="w-[56px] h-[56px] shrink-0 bg-[#00FFB3] rounded-xl flex items-center justify-center border-[3px] border-[#00FFB3] shadow-[4px_4px_0px_currentColor] transition-all hover:scale-105 active:scale-95 active:translate-y-[2px] active:shadow-none"
            data-testid="button-send-prompt"
          >
            <Send size={24} className="text-[#0B0B0E]" strokeWidth={3} />
          </button>
        </form>
      </footer>
    </div>
  );
}