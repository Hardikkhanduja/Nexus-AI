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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0D0D12] border-r border-secondary/50 shadow-[2px_0_12px_rgba(0,200,255,0.2)] z-50 flex flex-col"
            data-testid="sidebar"
          >
            <div className="p-6 border-b border-border/20">
              <h2 className="font-display text-[10px] text-primary tracking-widest text-shadow-primary">NEXUS AI</h2>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 custom-scrollbar">
              <div className="mb-2 px-3 text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Workspace</div>
              {mainItems.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose} className="block">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 cursor-pointer group ${active ? 'bg-primary/10 text-primary' : 'text-secondary/70 hover:bg-primary/10 hover:text-primary'}`} data-testid={`sidebar-link-${item.label.replace(/\s+/g, '-').toLowerCase()}`}>
                      <item.icon size={18} className={`transition-colors ${active ? 'text-primary' : 'text-secondary group-hover:text-primary'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="mt-6 mb-2 px-3 text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">System</div>
              {bottomItems.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose} className="block">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 cursor-pointer group ${active ? 'bg-primary/10 text-primary' : 'text-secondary/70 hover:bg-primary/10 hover:text-primary'}`} data-testid={`sidebar-link-${item.label.replace(/\s+/g, '-').toLowerCase()}`}>
                      <item.icon size={18} className={`transition-colors ${active ? 'text-primary' : 'text-secondary group-hover:text-primary'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
