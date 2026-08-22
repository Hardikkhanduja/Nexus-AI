import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { Bot, Brain, Sparkles, Search, Zap, Target, Edit3 } from "lucide-react";

interface ProfilePageProps {
  onOpenSidebar: () => void;
}

const codingLanguages = ["TypeScript", "JavaScript", "Python", "Rust", "Go", "C++", "Ruby", "Swift", "Java"];
const writingStyles = ["Technical", "Concise", "Detailed", "Professional", "Casual", "Academic", "Creative"];
const availableAgents = [
  { name: "GPT", icon: Bot, color: "#00C8FF" },
  { name: "Claude", icon: Brain, color: "#FF4FD8" },
  { name: "Gemini", icon: Sparkles, color: "#00FFB3" },
  { name: "DeepSeek", icon: Search, color: "#00C8FF" },
  { name: "Mistral", icon: Zap, color: "#FF4FD8" },
  { name: "Perplexity", icon: Target, color: "#00FFB3" }
];

export default function ProfilePage({ onOpenSidebar }: ProfilePageProps) {
  const { profile, preferences, updateProfile, updatePreferences, isLoading } = useProfile();
  const { toast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditAvatarUrl(profile.avatarUrl || "");
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await updateProfile({
        name: editName,
        avatarUrl: editAvatarUrl || null
      });
      if (res.success) {
        toast({ title: "Success", description: "Profile updated successfully." });
        setIsEditingProfile(false);
      } else {
        toast({ title: "Error", description: res.error || "Failed to update profile", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update profile due to network issue", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferenceChange = async (key: "preferredCodingLanguage" | "preferredWritingStyle", value: string) => {
    try {
      const res = await updatePreferences({ [key]: value });
      if (res.success) {
        toast({ title: "Success", description: "Preference updated successfully." });
      } else {
        toast({ title: "Error", description: res.error || "Failed to update preference", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update preference", variant: "destructive" });
    }
  };

  const handleToggleAgent = async (agentName: string) => {
    if (!preferences) return;
    const currentFavs = preferences.favoriteAgents || [];
    const updatedFavs = currentFavs.includes(agentName)
      ? currentFavs.filter((a) => a !== agentName)
      : [...currentFavs, agentName];

    try {
      const res = await updatePreferences({ favoriteAgents: updatedFavs });
      if (res.success) {
        toast({ title: "Success", description: "Favorite agents updated." });
      } else {
        toast({ title: "Error", description: res.error || "Failed to update favorite agents", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update favorite agents", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative bg-[#0D0D12]">
        <div className="font-display text-sm text-[#00FFB3] animate-pulse">LOADING COGNITIVE CORE...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative bg-[#0D0D12] text-center p-4">
        <div className="font-display text-sm text-destructive mb-4">ACCESS DENIED / USER NOT FOUND</div>
        <p className="text-muted-foreground font-sans text-sm">Please log in to access this terminal.</p>
      </div>
    );
  }

  const queriesLimit = profile.stats?.dailyQueryLimit || 30;
  const queriesUsed = profile.stats?.queriesUsedToday || 0;
  const queriesRemaining = Math.max(0, queriesLimit - queriesUsed);
  const percentUsed = Math.min(100, (queriesUsed / queriesLimit) * 100);

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-[#0D0D12]" data-testid="page-profile">
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[3px] border-[#00C8FF] bg-[#0D0D12] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-profile"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-[#00FFB3] tracking-widest uppercase flex items-center gap-2 truncate">
            USER PROFILE
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SignedIn>
            <div className="p-0.5 border-2 border-[#00FFB3] rounded-full">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-[1000px] w-full mx-auto pb-16">
        
        {/* UPPER GRID: AVATAR & QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* AVATAR CARD */}
          <div className="md:col-span-1 cartoon-card p-6 flex flex-col items-center justify-center text-center relative bg-[#14141A]">
            <div className="relative w-28 h-28 rounded-full border-4 border-[#00FFB3] shadow-[0_0_15px_rgba(0,255,179,0.3)] overflow-hidden mb-4 bg-background">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-[#0D0D12] to-[#14141A] text-[#00FFB3] font-display">
                  {profile.name?.slice(0, 1).toUpperCase() || "?"}
                </div>
              )}
            </div>
            
            <h3 className="font-display text-sm text-[#00FFB3] truncate w-full max-w-[200px]" title={profile.name || "Agent"}>
              {profile.name || "AGENT"}
            </h3>
            <p className="font-sans text-[10px] text-muted-foreground truncate w-full mt-1 mb-6">
              {profile.email}
            </p>

            <button
              onClick={handleEditClick}
              className="px-4 py-2 border-2 border-[#00C8FF] text-[#00C8FF] font-sans font-bold text-xs rounded-lg hover:bg-[#00C8FF]/10 active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
              data-testid="button-edit-profile"
            >
              Edit Identity <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* STATS PANEL */}
          <div className="md:col-span-2 cartoon-card-cyan p-6 flex flex-col justify-between bg-[#14141A] space-y-6">
            <div>
              <h3 className="font-display text-xs text-[#00C8FF] mb-4 uppercase">System Limits & Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-sans text-[#888]">
                  <span>Queries used today:</span>
                  <span className="font-bold text-[#00C8FF]">{queriesUsed} / {queriesLimit}</span>
                </div>
                {/* PROGRESS BAR */}
                <div className="w-full bg-[#0D0D12] h-4 border-2 border-[#00C8FF]/30 rounded-full overflow-hidden p-[2px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentUsed}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00FFB3] to-[#00C8FF] shadow-[0_0_8px_#00FFB3]"
                  />
                </div>
                <div className="text-[10px] font-sans text-right text-muted-foreground italic">
                  {queriesRemaining} queries remaining today
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#00C8FF]/20">
              <div>
                <div className="text-[10px] font-display text-[#888] uppercase mb-1">Lifetime Queries</div>
                <div className="font-display text-lg text-[#00FFB3]">
                  {profile.stats?.totalLifetimeQueries || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-display text-[#888] uppercase mb-1">Total Cycles</div>
                <div className="font-display text-lg text-[#FF4FD8]">
                  {profile.stats?.conversationCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: PREFERENCES & COGNITIVE CONTROLS */}
        <div className="cartoon-card-pink p-6 bg-[#14141A] space-y-8">
          <h3 className="font-display text-xs text-[#FF4FD8] uppercase border-b border-[#FF4FD8]/20 pb-3">Cognitive Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PREFERRED CODING LANGUAGE */}
            <div className="space-y-3">
              <label className="block text-[10px] font-display text-[#00FFB3] uppercase">Preferred Language</label>
              <select
                value={preferences?.preferredCodingLanguage || ""}
                onChange={(e) => handlePreferenceChange("preferredCodingLanguage", e.target.value)}
                className="w-full bg-[#0D0D12] border-3 border-[#FF4FD8]/50 focus:border-[#FF4FD8] outline-none rounded-xl px-4 py-3 text-foreground font-sans cursor-pointer focus:shadow-[0_0_10px_rgba(255,79,216,0.2)] transition-all"
                data-testid="select-preferred-language"
              >
                <option value="">None / System Default</option>
                {codingLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* PREFERRED WRITING STYLE */}
            <div className="space-y-3">
              <label className="block text-[10px] font-display text-[#00FFB3] uppercase">Writing Mode</label>
              <select
                value={preferences?.preferredWritingStyle || ""}
                onChange={(e) => handlePreferenceChange("preferredWritingStyle", e.target.value)}
                className="w-full bg-[#0D0D12] border-3 border-[#FF4FD8]/50 focus:border-[#FF4FD8] outline-none rounded-xl px-4 py-3 text-foreground font-sans cursor-pointer focus:shadow-[0_0_10px_rgba(255,79,216,0.2)] transition-all"
                data-testid="select-writing-style"
              >
                <option value="">None / System Default</option>
                {writingStyles.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FAVORITE AGENTS */}
          <div className="space-y-4">
            <label className="block text-[10px] font-display text-[#00FFB3] uppercase">Favorite Agents</label>
            <div className="flex flex-wrap gap-4">
              {availableAgents.map((agent) => {
                const isFav = preferences?.favoriteAgents?.includes(agent.name) || false;
                const IconComponent = agent.icon;
                return (
                  <motion.div
                    key={agent.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleAgent(agent.name)}
                    className="border-[3px] rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-shadow"
                    style={{
                      borderColor: agent.color,
                      backgroundColor: isFav ? `${agent.color}15` : "#0D0D12",
                      boxShadow: isFav ? `4px 4px 0px ${agent.color}` : "2px 2px 0px rgba(0,0,0,0.5)",
                      color: agent.color,
                      opacity: isFav ? 1 : 0.6
                    }}
                    data-testid={`profile-pill-agent-${agent.name.toLowerCase()}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-sans font-semibold text-sm">{agent.name}</span>
                    {isFav && <span className="ml-1 text-[#00FFB3] font-bold">✓</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[440px] cartoon-card p-8 bg-[#0D0D12]"
            >
              <h3 className="font-display text-sm text-[#00FFB3] mb-6 uppercase">Modify Identity</h3>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-display text-[#00C8FF] uppercase mb-1.5">Agent Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-[#14141A] border-3 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(0,200,255,0.2)] transition-all"
                    data-testid="input-edit-name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-display text-[#00C8FF] uppercase mb-1.5">Avatar Image URL</label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-[#14141A] border-3 border-[#00C8FF]/50 focus:border-[#00C8FF] outline-none rounded-xl px-4 py-2.5 text-foreground font-sans placeholder:text-muted-foreground/30 focus:shadow-[0_0_12px_rgba(0,200,255,0.2)] transition-all"
                    data-testid="input-edit-avatar"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 bg-transparent text-[#888] border-[3px] border-[#888] rounded-xl px-4 py-2.5 font-sans font-bold hover:bg-[#888]/10 active:translate-y-[2px] transition-all"
                    data-testid="button-cancel-edit-profile"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-[#00FFB3] text-[#0D0D12] border-[3px] border-[#00FFB3] rounded-xl px-4 py-2.5 font-sans font-bold hover:bg-[#00FFB3]/90 active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
                    style={{ boxShadow: "3px 3px 0px #00C8FF" }}
                    data-testid="button-submit-edit-profile"
                  >
                    {isUpdating ? "Saving..." : <><Zap className="w-4 h-4 fill-current inline" /> Save Identity</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
