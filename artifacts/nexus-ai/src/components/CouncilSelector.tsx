import React, { useState } from "react";
import {
  Lock,
  Sparkles,
  Check,
  ArrowRight,
  Wand2,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Rocket,
  Briefcase,
  BarChart3,
  Scale,
  SearchCheck,
  FileText,
  Cloud,
  ShieldCheck,
  Code2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface CouncilRole {
  id: string;
  name: string;
  stance: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Council {
  id: string;
  name: string;
  description: string;
  requiresPro: boolean;
  roles: CouncilRole[];
}

const COUNCILS: Council[] = [
  {
    id: "auto",
    name: "Auto-Detect",
    description: "AI classifies query domain & routes to best council.",
    requiresPro: false,
    roles: [
      { id: "auto_classifier", name: "AI Classifier", stance: "Domain Intelligence", icon: Wand2 }
    ]
  },
  {
    id: "general",
    name: "General Debate",
    description: "Balanced 3-way debate: optimistic, skeptical, & empirical.",
    requiresPro: false,
    roles: [
      { id: "optimist", name: "Optimist", stance: "Visionary", icon: TrendingUp },
      { id: "skeptic", name: "Skeptic", stance: "Risk-Focused", icon: ShieldAlert },
      { id: "fact_checker", name: "Fact-Checker", stance: "Empirical", icon: CheckCircle2 }
    ]
  },
  {
    id: "startup",
    name: "Startup & VC",
    description: "Evaluate ideas from Product, VC Investor, and Analyst.",
    requiresPro: true,
    roles: [
      { id: "product_visionary", name: "Product", stance: "Growth", icon: Rocket },
      { id: "vc_investor", name: "VC Investor", stance: "Economics", icon: Briefcase },
      { id: "market_analyst", name: "Analyst", stance: "Competition", icon: BarChart3 }
    ]
  },
  {
    id: "legal",
    name: "Legal Council",
    description: "Examine issues through Defense, Regulatory, & Compliance.",
    requiresPro: true,
    roles: [
      { id: "defense_counsel", name: "Defense", stance: "Rights", icon: Scale },
      { id: "compliance_auditor", name: "Compliance", stance: "Regulations", icon: SearchCheck },
      { id: "impartial_arbitrator", name: "Arbitrator", stance: "Precedent", icon: FileText }
    ]
  },
  {
    id: "tech",
    name: "Engineering",
    description: "Technical breakdown: Cloud Architecture, Security, & Dev.",
    requiresPro: true,
    roles: [
      { id: "cloud_architect", name: "Architect", stance: "Scalability", icon: Cloud },
      { id: "security_engineer", name: "Security", stance: "Zero-Trust", icon: ShieldCheck },
      { id: "pragmatic_dev", name: "Lead Dev", stance: "Delivery", icon: Code2 }
    ]
  }
];

interface CouncilSelectorProps {
  selectedCouncilId: string;
  onSelectCouncil: (councilId: string) => void;
  userTier: "free" | "pro";
  onToggleTier: () => void;
}

export const CouncilSelector: React.FC<CouncilSelectorProps> = ({
  selectedCouncilId,
  onSelectCouncil,
  userTier,
  onToggleTier,
}) => {
  const [showProModal, setShowProModal] = useState(false);

  const handleCouncilClick = (council: Council) => {
    if (council.requiresPro && userTier === "free") {
      setShowProModal(true);
    } else {
      onSelectCouncil(council.id);
    }
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Select Active Council
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              userTier === "pro"
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {userTier === "pro" ? "PRO UNLOCKED" : "FREE PLAN"}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTier}
            className="text-xs h-7 border-indigo-500/30 hover:border-indigo-500/80 text-indigo-300 hover:text-indigo-200 cursor-pointer"
          >
            {userTier === "free" ? "Switch to Pro (Demo)" : "Switch to Free"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {COUNCILS.map((council) => {
          const isSelected = selectedCouncilId === council.id;
          const isLocked = council.requiresPro && userTier === "free";

          return (
            <button
              key={council.id}
              onClick={() => handleCouncilClick(council)}
              className={`relative text-left p-3 rounded-lg transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              {isLocked && (
                <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </div>
              )}

              <div className="font-bold text-xs text-slate-100 mb-1 flex items-center gap-1.5">
                {council.name}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                {council.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {council.roles.map((r) => {
                  const RoleIcon = r.icon;
                  return (
                    <span
                      key={r.id}
                      className="text-[9px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/50 flex items-center gap-1"
                    >
                      <RoleIcon className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{r.name}</span>
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={showProModal} onOpenChange={setShowProModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5 text-amber-400" /> Unlock Domain-Specific Councils
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Domain Auto-Classification for specialized panels (Startup, Legal, Tech) is a <strong>PRO</strong> feature. Upgrade to Pro to unlock automatic specialized council routing!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400" /> AI Domain Auto-Classification
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400" /> Startup & VC Evaluation Panel
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400" /> Legal & Compliance Defense Council
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400" /> Engineering & Security Council
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowProModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onToggleTier();
                setShowProModal(false);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold"
            >
              Unlock Pro Now (Demo) <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
