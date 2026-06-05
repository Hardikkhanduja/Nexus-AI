import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface ChatWorkspaceProps {
  onOpenSidebar: () => void;
}

export default function ChatWorkspace({ onOpenSidebar }: ChatWorkspaceProps) {
  const [prompt, setPrompt] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPrompt("");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative" data-testid="page-chat">
      <header className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-background/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="p-1 text-primary hover:bg-primary/10 transition-colors rounded-sm"
            data-testid="button-open-sidebar-chat"
          >
            <div className="flex flex-col gap-[3px] w-5">
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-primary text-shadow-primary tracking-wider mt-1">NEW CONVERSATION</h2>
        </div>
        <div className="text-secondary text-xs font-mono">
          28 queries remaining today
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 179, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 179, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}></div>

        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="font-display text-sm md:text-lg text-primary text-shadow-primary tracking-widest relative inline-block"
          >
            AGENTS ARE STANDING BY...
            <div className="absolute -left-8 top-1/2 w-4 h-[2px] bg-primary shadow-[0_0_8px_rgba(0,255,179,0.8)]" />
            <div className="absolute -right-8 top-1/2 w-4 h-[2px] bg-primary shadow-[0_0_8px_rgba(0,255,179,0.8)]" />
          </motion.div>
        </motion.div>
      </main>

      <footer className="p-6 bg-background/90 backdrop-blur-md shrink-0 border-t border-primary/10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
          <div className="flex-1 relative bg-[#08080B] glow-border-primary rounded-none transition-shadow group focus-within:shadow-[0_0_16px_rgba(0,255,179,0.4)]">
            <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-primary"></div>
            
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Initialize command sequence..."
              className="w-full bg-transparent border-none outline-none py-3.5 px-5 text-foreground placeholder:text-primary/40 font-sans focus:ring-0"
              data-testid="input-chat-prompt"
            />
          </div>
          <button 
            type="submit"
            className="pixel-button px-6 flex items-center justify-center shrink-0"
            data-testid="button-send-prompt"
          >
            <Send size={20} className="text-primary" />
          </button>
        </form>
      </footer>
    </div>
  );
}
