import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/hooks/useUsage";
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
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { usage } = useUsage();
  const [recentConversations, setRecentConversations] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const token = localStorage.getItem("nexus_token");
      fetch("/api/ai/conversations", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        }
      })
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setRecentConversations(data.slice(0, 5));
      })
      .catch((err) => console.error("Failed to load recent chats:", err));
    }
  }, [isOpen, isAuthenticated]);

  // Dynamic system items based on auth state
  const bottomItems = [
    ...(isAuthenticated 
      ? [
          { icon: User, label: "Profile", path: "/profile" },
          { icon: Gauge, label: "Usage & Limits", path: "/usage" },
          { icon: Settings, label: "Settings", path: "/settings" }
        ]
      : [
          { icon: LogIn, label: "Login", path: "/login" },
          { icon: Gauge, label: "Usage & Limits", path: "/usage" }
        ]
    ),
    { icon: BookOpen, label: "Documentation", path: "/docs" },
    { icon: MessageCircle, label: "Feedback", path: "/feedback" }
  ];

  const handleLogout = () => {
    logout();
    onClose();
    setLocation("/");
  };

  const queriesUsed = usage?.queriesUsedToday ?? 0;
  const queriesLimit = usage?.dailyQueryLimit ?? (isAuthenticated ? 30 : 5);
  const percentUsed = Math.min(100, (queriesUsed / queriesLimit) * 100);

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
            <div className="p-5 flex flex-col items-start gap-4">
              <div className="flex items-center justify-between w-full">
                <h2 className="font-display text-xs tracking-widest mt-1">
                  <span className="text-[#00FFB3]">NEXUS</span> <span className="text-[#FF4FD8]">AI</span>
                </h2>
                <div className="bg-primary/10 border border-primary rounded-full px-2 py-0.5 text-[9px] font-sans font-bold text-[#00FFB3]">
                  v1.0
                </div>
              </div>

              {/* USER PROFILE INFO OR LOGIN CTA */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 p-3 bg-[#14141A] border-2 border-[#00FFB3] rounded-xl w-full" data-testid="sidebar-user-card">
                  <div className="w-10 h-10 rounded-full border-2 border-[#00FFB3] overflow-hidden flex items-center justify-center bg-background shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-display text-xs text-[#00FFB3]">
                        {user.name?.slice(0, 1).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[9px] text-[#00FFB3] truncate">{user.name || "Agent"}</div>
                    <div className="font-sans text-[9px] text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => { onClose(); setLocation("/login"); }}
                  className="flex items-center justify-center gap-2 p-3 bg-[#14141A] border-2 border-dashed border-[#FF4FD8] rounded-xl w-full cursor-pointer hover:bg-[#FF4FD8]/5 transition-colors"
                  data-testid="sidebar-login-prompt"
                >
                  <LogIn size={14} className="text-[#FF4FD8]" />
                  <span className="font-display text-[8px] text-[#FF4FD8] uppercase">Authenticate Node</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 px-3 custom-scrollbar">
              <div className="font-display text-[8px] text-[#555] tracking-widest px-4 mb-2 mt-2">
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

              {/* RECENT CONVERSATIONS */}
              {isAuthenticated && recentConversations.length > 0 && (
                <>
                  <div className="font-display text-[8px] text-[#555] tracking-widest px-4 mb-2 mt-6">
                    RECENT CHATS
                  </div>
                  {recentConversations.map((conv) => {
                    const active = location === `/chat/${conv.id}`;
                    return (
                      <Link key={conv.id} href={`/chat/${conv.id}`} onClick={onClose} className="block">
                        <div
                          className={`flex flex-row items-center gap-3 px-4 py-2 rounded-xl cursor-pointer font-sans font-medium transition-all group ${
                            active
                              ? 'bg-primary/10 border-l-[4px] border-primary text-primary'
                              : 'text-[#888] hover:bg-[rgba(0,255,179,0.06)] hover:border-l-[4px] hover:border-primary hover:text-primary border-l-[4px] border-transparent hover:translate-x-1'
                          }`}
                        >
                          <MessageSquare size={16} strokeWidth={2.5} className={`transition-colors shrink-0 ${active ? 'text-[#00FFB3]' : 'text-[#888] group-hover:text-[#00FFB3]'}`} />
                          <span className="text-xs truncate">{conv.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}

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

              {/* LOGOUT BUTTON FOR AUTHENTICATED USERS */}
              {isAuthenticated && (
                <div 
                  onClick={handleLogout}
                  className="flex flex-row items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans font-medium transition-all group text-[#888] hover:bg-[rgba(255,79,216,0.06)] hover:border-l-[4px] hover:border-accent hover:text-accent border-l-[4px] border-transparent hover:translate-x-1"
                  data-testid="sidebar-link-logout"
                >
                  <LogOut size={20} strokeWidth={2.5} className="text-[#888] group-hover:text-[#FF4FD8] transition-colors" />
                  <span className="text-sm">Logout</span>
                </div>
              )}
            </div>

            {/* USAGE BAR */}
            <div className="sticky bottom-0 p-4 border-t-2 border-[#14141A] bg-[#0D0D12]">
              <div className="font-sans text-[10px] text-[#888] font-bold mb-2 uppercase flex justify-between">
                <span>Usage: {queriesUsed} / {queriesLimit}</span>
                <span className="text-[#00FFB3]">{queriesLimit - queriesUsed} left</span>
              </div>
              <div className="h-[10px] bg-[#14141A] rounded-full border border-border overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentUsed}%` }}
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