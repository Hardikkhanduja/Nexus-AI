import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import {
  MessageSquareHeart,
  Star,
  Send,
  Heart,
  Lightbulb,
  Bug,
  MessageCircle,
  Sparkles,
  User,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackPageProps {
  onOpenSidebar: () => void;
}

interface ReviewItem {
  id: string;
  email: string;
  targetTeam: string;
  type: string;
  rating: number;
  title: string;
  comment: string;
  timestamp: string;
}

const INITIAL_COMMUNITY_REVIEWS: ReviewItem[] = [
  {
    id: "rev_1",
    email: "areebh2112@gmail.com",
    targetTeam: "Frontend & UX Team",
    type: "Review",
    rating: 4,
    title: "great work",
    comment: "it is great",
    timestamp: "8/22/2026, 4:46:02 PM",
  },
];

export default function FeedbackPage({ onOpenSidebar }: FeedbackPageProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"submit" | "community">("submit");
  const [feedbackType, setFeedbackType] = useState<string>("Builder Review");
  const [targetTeam, setTargetTeam] = useState<string>("Nexus Core Team");
  const [rating, setRating] = useState<number>(5);
  const [titleTopic, setTitleTopic] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_COMMUNITY_REVIEWS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newReview: ReviewItem = {
      id: `rev_${Date.now()}`,
      email: userEmail.trim() || "anonymous@nexus.ai",
      targetTeam: targetTeam,
      type: feedbackType === "Builder Review" ? "Review" : feedbackType,
      rating: rating,
      title: titleTopic.trim() || "Community Review",
      comment: reviewComment.trim(),
      timestamp: new Date().toLocaleString(),
    };

    setReviewsList((prev) => [newReview, ...prev]);
    setActiveTab("community");

    toast({
      title: "Feedback Transmitted!",
      description: "Your review has been added to the Community Wall.",
    });

    // Reset form
    setTitleTopic("");
    setReviewComment("");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-[#0B0B0E] text-slate-100" data-testid="page-feedback">
      {/* TOP HEADER BAR (MATCHES SCREENSHOT EXACTLY) */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[2px] border-slate-800 bg-[#0B0B0E] shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 border-2 border-primary/50 rounded-lg hover:border-primary hover:shadow-[2px_2px_0px_#00FFB3] transition-all bg-[#14141A] cursor-pointer"
            data-testid="button-open-sidebar-feedback"
          >
            <div className="flex flex-col gap-[4px] w-[24px]">
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
              <div className="h-[3px] bg-[#00FFB3] w-full rounded-full"></div>
            </div>
          </button>
          <div>
            <h2 className="font-display text-xs text-slate-100 tracking-widest uppercase flex items-center gap-2 truncate">
              <MessageSquareHeart className="w-4 h-4 text-[#FF4FD8]" /> BUILDER FEEDBACK & PROTOTYPE REVIEWS
            </h2>
            <p className="text-[10px] text-slate-400 font-sans">
              Help us refine Nexus AI — Send thoughts directly to the builders
            </p>
          </div>
        </div>

        {/* TOP RIGHT TAB BUTTONS */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-[#14141A] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "submit"
                  ? "bg-[#FF4FD8] text-[#0B0B0E] shadow-[0_0_10px_rgba(255,79,216,0.5)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Submit Review
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "community"
                  ? "bg-[#FF4FD8] text-[#0B0B0E] shadow-[0_0_10px_rgba(255,79,216,0.5)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Community Wall ({reviewsList.length})
            </button>
          </div>

          <SignedIn>
            <div className="p-0.5 border-2 border-[#00FFB3] rounded-full ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0B0B0E]">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "submit" ? (
              <motion.div
                key="tab-submit"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#12111A] border-2 border-purple-900/40 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6"
              >
                {/* FEEDBACK TYPE GRID */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    FEEDBACK TYPE
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Builder Review", icon: Heart, color: "#FF4FD8" },
                      { label: "Feature Request", icon: Lightbulb, color: "#00FFB3" },
                      { label: "Bug Report", icon: Bug, color: "#FF453A" },
                      { label: "General Feedback", icon: MessageCircle, color: "#00C8FF" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = feedbackType === item.label;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setFeedbackType(item.label)}
                          className={`p-4 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#1A1326] border-[#FF4FD8] text-slate-100 shadow-[0_0_15px_rgba(255,79,216,0.3)] ring-1 ring-[#FF4FD8]"
                              : "bg-[#161522] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <Icon className="w-5 h-5" style={{ color: isSelected ? "#FF4FD8" : item.color }} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* TARGET BUILDER TEAM & RATING ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        TARGET BUILDER TEAM
                      </label>
                      <select
                        value={targetTeam}
                        onChange={(e) => setTargetTeam(e.target.value)}
                        className="w-full bg-[#181724] border border-slate-700 focus:border-[#FF4FD8] outline-none rounded-xl p-3 text-xs text-slate-100 cursor-pointer transition-all"
                      >
                        <option value="Nexus Core Team">Nexus Core Team</option>
                        <option value="Frontend & UX Team">Frontend & UX Team</option>
                        <option value="Multi-Agent AI Team">Multi-Agent AI Team</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        PROTOTYPE RATING ({rating}/5 STARS)
                      </label>
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= rating
                                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                                  : "text-slate-700"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* TITLE & EMAIL ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        TITLE / TOPIC (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={titleTopic}
                        onChange={(e) => setTitleTopic(e.target.value)}
                        placeholder="e.g. Great UX for chat workflows!"
                        className="w-full bg-[#181724] border border-slate-700 focus:border-[#FF4FD8] outline-none rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 font-sans transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        YOUR EMAIL (OPTIONAL FOR UPDATES)
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#181724] border border-slate-700 focus:border-[#FF4FD8] outline-none rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 font-sans transition-all"
                      />
                    </div>
                  </div>

                  {/* REVIEW TEXTAREA */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      REVIEW & COMMENTS *
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      rows={5}
                      placeholder="Share your detailed thoughts, suggestions, or issues with the prototype..."
                      className="w-full bg-[#181724] border border-slate-700 focus:border-[#FF4FD8] outline-none rounded-xl p-4 text-xs text-slate-100 placeholder:text-slate-600 font-sans transition-all resize-none"
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-[#FF4FD8] text-[#0B0B0E] font-sans font-bold px-6 py-3 rounded-xl border-[2px] border-[#FF4FD8] shadow-[0_0_15px_rgba(255,79,216,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      <Send className="w-4 h-4" /> Submit Feedback
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* COMMUNITY WALL VIEW (MATCHES SCREENSHOT 2) */
              <motion.div
                key="tab-community"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    COMMUNITY REVIEWS & FEEDBACK ({reviewsList.length})
                  </h3>
                  <span className="text-xs text-[#00FFB3] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Real-time community feedback
                  </span>
                </div>

                <div className="space-y-4">
                  {reviewsList.map((rev) => (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#12111A] border-2 border-slate-800 rounded-2xl p-6 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-200">{rev.email}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>Target: <strong className="text-emerald-400">{rev.targetTeam}</strong></span>
                              <span>•</span>
                              <span className="text-[#FF4FD8] font-bold">{rev.type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating}/5
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="font-display text-sm text-slate-100 mb-1">{rev.title}</h4>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">{rev.comment}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rev.timestamp}
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 text-slate-400 font-sans font-semibold px-2 py-0.5 rounded">
                          VERIFIED PROTOTYPE SUBMISSION
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
