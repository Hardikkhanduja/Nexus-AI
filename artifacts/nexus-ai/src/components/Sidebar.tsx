import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { 
  PlusCircle, MessageSquare, BarChart2, Activity, Bookmark, 
  LogIn, User, Settings, Gauge, BookOpen, MessageCircle, LogOut 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainItems = [
  { icon: PlusCircle, label: "New Chat", path: "/chat" },
  { icon: MessageSquare, label: "Chat History", path: "/history" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Activity, label: "Agent Performance", path: "/performance" },
  { icon: Bookmark, label: "Saved Conversations", path: "/saved" },
];

const bottomItems = [
  { icon: LogIn, label: "Login", path: "/login" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Gauge, label: "Usage & Limits", path: "/usage" },
  { icon: BookOpen, label: "Documentation", path: "/docs" },
  { icon: MessageCircle, label: "Feedback", path: "/feedback" },
  { icon: LogOut, label: "Logout", path: "/logout" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
            data-testid="sidebar-overlay"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0D0D12] border-r-[3px] border-[#00C8FF] shadow-[4px_0px_0px_#00C8FF] z-50 flex flex-col"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,200,255,0.025) 0px, rgba(0,200,255,0.025) 1px, transparent 1px, transparent 8px)'
            }}
            data-testid="sidebar"
          >
            {/* HEADER */}
            <div className="p-5 flex flex-col items-start gap-3">
              <h2 className="font-display text-xs tracking-widest mt-1">
                <span className="text-[#00FFB3]">NEXUS</span> <span className="text-[#FF4FD8]">AI</span>
              </h2>
              <div className="bg-primary/10 border border-primary rounded-full px-2 py-0.5 text-[9px] font-sans font-bold text-[#00FFB3]">
                v1.0
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 px-3 custom-scrollbar">
              <div className="font-display text-[8px] text-[#555] tracking-widest px-4 mb-2 mt-4">
                NAVIGATION
              </div>
              {mainItems.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose} className="block">
                    <div 
                      className={`flex flex-row items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans font-medium transition-all group ${
                        active 
                          ? 'bg-primary/10 border-l-[4px] border-primary text-primary' 
                          : 'text-[#888] hover:bg-[rgba(0,255,179,0.06)] hover:border-l-[4px] hover:border-primary hover:text-primary border-l-[4px] border-transparent hover:translate-x-1'
                      }`} 
                      data-testid={`sidebar-link-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <item.icon size={20} strokeWidth={2.5} className={`transition-colors ${active ? 'text-[#00FFB3]' : 'text-[#888] group-hover:text-[#00FFB3]'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="font-display text-[8px] text-[#555] tracking-widest px-4 mb-2 mt-6">
                SYSTEM
              </div>
              {bottomItems.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose} className="block">
                    <div 
                      className={`flex flex-row items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans font-medium transition-all group ${
                        active 
                          ? 'bg-primary/10 border-l-[4px] border-primary text-primary' 
                          : 'text-[#888] hover:bg-[rgba(0,255,179,0.06)] hover:border-l-[4px] hover:border-primary hover:text-primary border-l-[4px] border-transparent hover:translate-x-1'
                      }`} 
                      data-testid={`sidebar-link-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <item.icon size={20} strokeWidth={2.5} className={`transition-colors ${active ? 'text-[#00FFB3]' : 'text-[#888] group-hover:text-[#00FFB3]'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* USAGE BAR */}
            <div className="sticky bottom-0 p-4 border-t-2 border-[#14141A] bg-[#0D0D12]">
              <div className="font-sans text-xs text-[#555] font-bold mb-2">
                12 / 30 QUERIES TODAY
              </div>
              <div className="h-[10px] bg-[#14141A] rounded-full border border-border overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "40%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00FFB3, #00C8FF)",
                    boxShadow: "0 0 8px rgba(0,255,179,0.5)"
                  }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}