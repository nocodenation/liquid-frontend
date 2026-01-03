"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  FileText,
  AlertOctagon,
  Wrench,
  CalendarClock,
  CheckCircle2,
  Plus,
  X,
  User,
  Calendar,
  Trash2,
  Check,
  Lock,
  Search,
  Target,
  TrendingUp,
  ClipboardCheck,
  FileSearch,
  Beaker,
  ListChecks,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CACHE_KEY = "resolution-workspace-data";

type ResolutionPath = "capa" | "correction" | "preventive";

interface PlannedAction {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  completed: boolean;
}

interface ResolutionData {
  preliminaryInvestigation: string;
  containment: {
    applicable: boolean;
    measures: string;
  };
  correction: string;
  plannedActions: PlannedAction[];
  verification: {
    fixEffective: boolean;
    noNewRisks: boolean;
    documentsUpdated: boolean;
  };
  rootCauseAnalysis: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    rootCause: string;
    contributingFactors: string;
  };
  actionPlanning: {
    correctiveAction: string;
    correctiveOwner: string;
    correctiveDate: string;
    preventiveAction: string;
    preventiveOwner: string;
    preventiveDate: string;
    effectivenessCriteria: string;
    reviewDate: string;
  };
  actionImplementation: {
    correctiveImplemented: boolean;
    correctiveNotes: string;
    preventiveImplemented: boolean;
    preventiveNotes: string;
  };
  effectivenessVerification: {
    evidence: string;
    effective: boolean | null;
    reviewerNotes: string;
  };
  finalVerification: {
    allActionsComplete: boolean;
    documentationComplete: boolean;
    stakeholdersNotified: boolean;
    lessonsLearned: string;
  };
}

interface ResolutionWorkspaceProps {
  path: ResolutionPath;
  problemStatement: string;
  riskScore: number;
  rationale: string;
  onComplete: (data: ResolutionData) => void;
  onBack: () => void;
}

const ncPhases = [
  { id: "preliminary", label: "Preliminary Investigation", icon: FileSearch },
  { id: "containment", label: "Containment", icon: AlertOctagon },
  { id: "correction", label: "Immediate Action/Correction", icon: Wrench },
  { id: "planned", label: "Planned Actions", icon: CalendarClock },
  { id: "verification", label: "Verification of Actions", icon: CheckCircle2 },
];

const capaPhases = [
  ...ncPhases,
  { id: "rootcause", label: "Root Cause Investigation", icon: Search },
  { id: "actionplanning", label: "Action & Effectiveness Planning", icon: Target },
  { id: "implementation", label: "Action Implementation", icon: ListChecks },
  { id: "effectiveness", label: "Verification of Effectiveness", icon: Beaker },
  { id: "final", label: "Final Verification", icon: ClipboardCheck },
];

const loadFromCache = (): ResolutionData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore
  }
  return null;
};

const saveToCache = (data: ResolutionData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
};

const pathConfig = {
  capa: {
    title: "CAPA Investigation",
    subtitle: "Full Root Cause Analysis & Systemic Correction",
    icon: ShieldAlert,
    color: "red",
    bgGradient: "from-red-500/10 to-red-500/5",
    borderColor: "border-red-500/30",
    accentColor: "text-red-500",
    buttonColor: "bg-red-500 hover:bg-red-600",
  },
  correction: {
    title: "Correction Only (NC)",
    subtitle: "Fix and Close with Documented Rationale",
    icon: ShieldCheck,
    color: "blue",
    bgGradient: "from-blue-500/10 to-blue-500/5",
    borderColor: "border-blue-500/30",
    accentColor: "text-blue-500",
    buttonColor: "bg-blue-500 hover:bg-blue-600",
  },
  preventive: {
    title: "Preventive Action",
    subtitle: "Mitigate Potential Risk Before Occurrence",
    icon: Shield,
    color: "amber",
    bgGradient: "from-amber-500/10 to-amber-500/5",
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-500",
    buttonColor: "bg-amber-500 hover:bg-amber-600",
  },
};

export function ResolutionWorkspace({
  path,
  problemStatement,
  riskScore,
  rationale: initialRationale,
  onComplete,
  onBack,
}: ResolutionWorkspaceProps) {
  const config = pathConfig[path];
  const Icon = config.icon;
  const phases = path === "capa" ? capaPhases : ncPhases;
  
  const [currentPhase, setCurrentPhase] = useState(phases[0].id);

  const getInitialData = (): ResolutionData => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Ignore
      }
    }
    return {
      preliminaryInvestigation: "",
      containment: { applicable: true, measures: "" },
      correction: "",
      plannedActions: [],
      verification: {
        fixEffective: false,
        noNewRisks: false,
        documentsUpdated: false,
      },
      rootCauseAnalysis: {
        why1: "",
        why2: "",
        why3: "",
        why4: "",
        why5: "",
        rootCause: "",
        contributingFactors: "",
      },
      actionPlanning: {
        correctiveAction: "",
        correctiveOwner: "",
        correctiveDate: "",
        preventiveAction: "",
        preventiveOwner: "",
        preventiveDate: "",
        effectivenessCriteria: "",
        reviewDate: "",
      },
      actionImplementation: {
        correctiveImplemented: false,
        correctiveNotes: "",
        preventiveImplemented: false,
        preventiveNotes: "",
      },
      effectivenessVerification: {
        evidence: "",
        effective: null,
        reviewerNotes: "",
      },
      finalVerification: {
        allActionsComplete: false,
        documentationComplete: false,
        stakeholdersNotified: false,
        lessonsLearned: "",
      },
    };
  };

  const [data, setData] = useState<ResolutionData>(getInitialData);
  const [newAction, setNewAction] = useState({ description: "", owner: "", dueDate: "" });

  useEffect(() => {
    saveToCache(data);
  }, [data]);

  const addPlannedAction = () => {
    if (!newAction.description || !newAction.owner || !newAction.dueDate) return;
    setData((prev) => ({
      ...prev,
      plannedActions: [
        ...prev.plannedActions,
        { id: Math.random().toString(36).substring(2, 9), ...newAction, completed: false },
      ],
    }));
    setNewAction({ description: "", owner: "", dueDate: "" });
  };

  const removePlannedAction = (id: string) => {
    setData((prev) => ({
      ...prev,
      plannedActions: prev.plannedActions.filter((a) => a.id !== id),
    }));
  };

  const toggleActionComplete = (id: string) => {
    setData((prev) => ({
      ...prev,
      plannedActions: prev.plannedActions.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      ),
    }));
  };

  const isPhaseComplete = (phaseId: string): boolean => {
    switch (phaseId) {
      case "preliminary":
        return data.preliminaryInvestigation.length >= 20;
      case "containment":
        return !data.containment.applicable || data.containment.measures.length > 0;
      case "correction":
        return data.correction.length > 0;
      case "planned":
        return data.plannedActions.every((a) => a.completed);
      case "verification":
        return data.verification.fixEffective && data.verification.noNewRisks && data.verification.documentsUpdated;
      case "rootcause":
        return data.rootCauseAnalysis.rootCause.length > 0;
      case "actionplanning":
        return (
          data.actionPlanning.correctiveAction.length > 0 &&
          data.actionPlanning.correctiveOwner.length > 0 &&
          data.actionPlanning.effectivenessCriteria.length > 0 &&
          data.actionPlanning.reviewDate.length > 0
        );
      case "implementation":
        return data.actionImplementation.correctiveImplemented && data.actionImplementation.preventiveImplemented;
      case "effectiveness":
        return data.effectivenessVerification.effective === true && data.effectivenessVerification.evidence.length > 0;
      case "final":
        return (
          data.finalVerification.allActionsComplete &&
          data.finalVerification.documentationComplete &&
          data.finalVerification.stakeholdersNotified
        );
      default:
        return false;
    }
  };

  const canSignOff = useMemo(() => {
    return phases.every((phase) => isPhaseComplete(phase.id));
  }, [data, phases]);

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase);

  const goToNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      setCurrentPhase(phases[currentPhaseIndex + 1].id);
    }
  };

  const goToPrevPhase = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhase(phases[currentPhaseIndex - 1].id);
    }
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case "preliminary":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSearch className={cn("w-5 h-5", config.accentColor)} />
                Preliminary Investigation
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Document initial findings and observations about the issue. What do you know so far?
              </p>
              <Textarea
                placeholder="Describe initial findings, observations, and any immediate facts gathered about the issue..."
                value={data.preliminaryInvestigation}
                onChange={(e) => setData((prev) => ({ ...prev, preliminaryInvestigation: e.target.value }))}
                className="min-h-32"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Minimum 20 characters required</p>
                <span className={cn("text-xs", data.preliminaryInvestigation.length >= 20 ? "text-emerald-500" : "text-muted-foreground")}>
                  {data.preliminaryInvestigation.length} / 20
                </span>
              </div>
            </CardContent>
          </Card>
        );

      case "containment":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertOctagon className={cn("w-5 h-5", config.accentColor)} />
                Containment (Stop the Bleeding)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Document immediate measures taken to control the issue (e.g., quarantine stock, halt production, notify stakeholders).
              </p>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                <Switch
                  id="containment-applicable"
                  checked={!data.containment.applicable}
                  onCheckedChange={(v) =>
                    setData((prev) => ({ ...prev, containment: { ...prev.containment, applicable: !v } }))
                  }
                />
                <Label htmlFor="containment-applicable" className="cursor-pointer">
                  Not Applicable - No containment action was needed
                </Label>
              </div>
              <AnimatePresence>
                {data.containment.applicable && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Textarea
                      placeholder="Describe containment measures taken (e.g., affected lots quarantined, production line stopped, customers notified)..."
                      value={data.containment.measures}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, containment: { ...prev.containment, measures: e.target.value } }))
                      }
                      className="min-h-24"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );

      case "correction":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className={cn("w-5 h-5", config.accentColor)} />
                Immediate Action/Correction
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Document what was done to fix the specific instance (e.g., reworked parts, updated documentation, retrained personnel).
              </p>
              <Textarea
                placeholder="Describe the correction action taken to address this specific instance..."
                value={data.correction}
                onChange={(e) => setData((prev) => ({ ...prev, correction: e.target.value }))}
                className="min-h-24"
              />
            </CardContent>
          </Card>
        );

      case "planned":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className={cn("w-5 h-5", config.accentColor)} />
                Planned Actions
                <Badge variant="secondary" className="ml-2">{data.plannedActions.length} Items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track corrections that cannot be completed immediately. Each action requires an owner and due date.
              </p>
              {data.plannedActions.length > 0 && (
                <div className="space-y-3 mb-6">
                  {data.plannedActions.map((action, idx) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("p-4 rounded-xl border transition-all", action.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30")}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleActionComplete(action.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            action.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-primary"
                          )}
                        >
                          {action.completed && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium", action.completed && "line-through text-muted-foreground")}>
                            {idx + 1}. {action.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{action.owner}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(action.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => removePlannedAction(action.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="p-4 rounded-xl border border-dashed bg-muted/20">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-sm">Action Description</Label>
                    <Input placeholder="What needs to be done..." value={newAction.description} onChange={(e) => setNewAction((prev) => ({ ...prev, description: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Owner</Label>
                    <Input placeholder="Responsible person..." value={newAction.owner} onChange={(e) => setNewAction((prev) => ({ ...prev, owner: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Due Date</Label>
                    <Input type="date" value={newAction.dueDate} onChange={(e) => setNewAction((prev) => ({ ...prev, dueDate: e.target.value }))} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addPlannedAction} disabled={!newAction.description || !newAction.owner || !newAction.dueDate} className="w-full gap-2" variant="outline">
                      <Plus className="w-4 h-4" />Add Action
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "verification":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className={cn("w-5 h-5", config.accentColor)} />
                Verification of Actions
                <Badge variant="outline" className="ml-2">All Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Confirm that all corrections have been verified before proceeding.
              </p>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.verification.fixEffective} onCheckedChange={(v) => setData((prev) => ({ ...prev, verification: { ...prev.verification, fixEffective: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">Correction Effectiveness Verified</p>
                    <p className="text-sm text-muted-foreground mt-1">The implemented correction has been tested and confirmed to resolve the issue.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.verification.noNewRisks} onCheckedChange={(v) => setData((prev) => ({ ...prev, verification: { ...prev.verification, noNewRisks: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">No New Risks Introduced</p>
                    <p className="text-sm text-muted-foreground mt-1">The correction has been assessed and confirmed not to introduce any new risks or issues.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.verification.documentsUpdated} onCheckedChange={(v) => setData((prev) => ({ ...prev, verification: { ...prev.verification, documentsUpdated: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">Documentation Updated</p>
                    <p className="text-sm text-muted-foreground mt-1">All relevant documents, procedures, and records have been updated to reflect the correction.</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        );

      case "rootcause":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className={cn("w-5 h-5", config.accentColor)} />
                Root Cause Investigation (5 Whys)
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Use the 5 Whys technique to drill down to the root cause of the problem.</p>
              <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", `bg-red-500/${num * 10 + 10} text-red-500`)}>{num}</span>
                      Why did {num === 1 ? "this happen" : "that happen"}?
                    </Label>
                    <Input
                      placeholder={num === 1 ? "First level - Why did this problem occur?" : num === 5 ? "Fifth level - Root cause identified" : `Level ${num} - Continue drilling down...`}
                      value={(data.rootCauseAnalysis as Record<string, string>)[`why${num}`]}
                      onChange={(e) => setData((prev) => ({ ...prev, rootCauseAnalysis: { ...prev.rootCauseAnalysis, [`why${num}`]: e.target.value } }))}
                      disabled={num > 1 && !(data.rootCauseAnalysis as Record<string, string>)[`why${num - 1}`]}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Root Cause Summary <span className="text-destructive">*</span></Label>
                <Textarea placeholder="Based on the 5 Whys analysis, the root cause is determined to be..." value={data.rootCauseAnalysis.rootCause} onChange={(e) => setData((prev) => ({ ...prev, rootCauseAnalysis: { ...prev.rootCauseAnalysis, rootCause: e.target.value } }))} className="min-h-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contributing Factors (Optional)</Label>
                <Textarea placeholder="Document any contributing factors that led to or exacerbated the issue..." value={data.rootCauseAnalysis.contributingFactors} onChange={(e) => setData((prev) => ({ ...prev, rootCauseAnalysis: { ...prev.rootCauseAnalysis, contributingFactors: e.target.value } }))} className="min-h-20" />
              </div>
            </CardContent>
          </Card>
        );

      case "actionplanning":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className={cn("w-5 h-5", config.accentColor)} />
                Action & Verification of Effectiveness Planning
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <h4 className="font-medium text-sm">Corrective Action Plan</h4>
                <div className="space-y-2">
                  <Label className="text-sm">Corrective Action Description <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="Describe the corrective action(s) to address the root cause..." value={data.actionPlanning.correctiveAction} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, correctiveAction: e.target.value } }))} className="min-h-20" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Action Owner <span className="text-destructive">*</span></Label>
                    <Input placeholder="Person responsible..." value={data.actionPlanning.correctiveOwner} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, correctiveOwner: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Target Date</Label>
                    <Input type="date" value={data.actionPlanning.correctiveDate} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, correctiveDate: e.target.value } }))} />
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <h4 className="font-medium text-sm">Preventive Action Plan</h4>
                <div className="space-y-2">
                  <Label className="text-sm">Preventive Action Description</Label>
                  <Textarea placeholder="Describe systemic changes to prevent recurrence..." value={data.actionPlanning.preventiveAction} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, preventiveAction: e.target.value } }))} className="min-h-20" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Action Owner</Label>
                    <Input placeholder="Person responsible..." value={data.actionPlanning.preventiveOwner} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, preventiveOwner: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Target Date</Label>
                    <Input type="date" value={data.actionPlanning.preventiveDate} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, preventiveDate: e.target.value } }))} />
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <h4 className="font-medium text-sm">Effectiveness Verification Plan</h4>
                <div className="space-y-2">
                  <Label className="text-sm">Effectiveness Criteria <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="Define measurable criteria to determine if the CAPA was effective (e.g., zero recurrence for 90 days)..." value={data.actionPlanning.effectivenessCriteria} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, effectivenessCriteria: e.target.value } }))} className="min-h-20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Scheduled Review Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={data.actionPlanning.reviewDate} onChange={(e) => setData((prev) => ({ ...prev, actionPlanning: { ...prev.actionPlanning, reviewDate: e.target.value } }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "implementation":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className={cn("w-5 h-5", config.accentColor)} />
                Action Implementation
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={data.actionImplementation.correctiveImplemented} onCheckedChange={(v) => setData((prev) => ({ ...prev, actionImplementation: { ...prev.actionImplementation, correctiveImplemented: v === true } }))} />
                  <span className="font-medium">Corrective Action Implemented</span>
                </label>
                <Textarea placeholder="Notes on corrective action implementation..." value={data.actionImplementation.correctiveNotes} onChange={(e) => setData((prev) => ({ ...prev, actionImplementation: { ...prev.actionImplementation, correctiveNotes: e.target.value } }))} className="min-h-20" />
              </div>
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={data.actionImplementation.preventiveImplemented} onCheckedChange={(v) => setData((prev) => ({ ...prev, actionImplementation: { ...prev.actionImplementation, preventiveImplemented: v === true } }))} />
                  <span className="font-medium">Preventive Action Implemented</span>
                </label>
                <Textarea placeholder="Notes on preventive action implementation..." value={data.actionImplementation.preventiveNotes} onChange={(e) => setData((prev) => ({ ...prev, actionImplementation: { ...prev.actionImplementation, preventiveNotes: e.target.value } }))} className="min-h-20" />
              </div>
            </CardContent>
          </Card>
        );

      case "effectiveness":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beaker className={cn("w-5 h-5", config.accentColor)} />
                Verification of Effectiveness
                <Badge variant="outline" className="ml-2">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Verify that the implemented actions are effective based on the defined criteria.</p>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Evidence of Effectiveness <span className="text-destructive">*</span></Label>
                <Textarea placeholder="Document evidence that supports the effectiveness determination..." value={data.effectivenessVerification.evidence} onChange={(e) => setData((prev) => ({ ...prev, effectivenessVerification: { ...prev.effectivenessVerification, evidence: e.target.value } }))} className="min-h-24" />
              </div>
              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                <Label className="text-sm font-medium">Effectiveness Determination</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="effectiveness" className="w-4 h-4" checked={data.effectivenessVerification.effective === true} onChange={() => setData((prev) => ({ ...prev, effectivenessVerification: { ...prev.effectivenessVerification, effective: true } }))} />
                    <span className="text-sm text-emerald-600 font-medium">Effective</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="effectiveness" className="w-4 h-4" checked={data.effectivenessVerification.effective === false} onChange={() => setData((prev) => ({ ...prev, effectivenessVerification: { ...prev.effectivenessVerification, effective: false } }))} />
                    <span className="text-sm text-red-600 font-medium">Not Effective</span>
                  </label>
                </div>
                {data.effectivenessVerification.effective === false && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                    A new CAPA may need to be initiated if the actions were not effective.
                  </motion.p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reviewer Notes</Label>
                <Textarea placeholder="Additional notes from the reviewer..." value={data.effectivenessVerification.reviewerNotes} onChange={(e) => setData((prev) => ({ ...prev, effectivenessVerification: { ...prev.effectivenessVerification, reviewerNotes: e.target.value } }))} className="min-h-20" />
              </div>
            </CardContent>
          </Card>
        );

      case "final":
        return (
          <Card className={cn("border-2", config.borderColor)}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className={cn("w-5 h-5", config.accentColor)} />
                Final Verification
                <Badge variant="outline" className="ml-2">All Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Confirm all final requirements before closing the CAPA.</p>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.finalVerification.allActionsComplete} onCheckedChange={(v) => setData((prev) => ({ ...prev, finalVerification: { ...prev.finalVerification, allActionsComplete: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">All Actions Complete</p>
                    <p className="text-sm text-muted-foreground mt-1">All corrective and preventive actions have been fully implemented.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.finalVerification.documentationComplete} onCheckedChange={(v) => setData((prev) => ({ ...prev, finalVerification: { ...prev.finalVerification, documentationComplete: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">Documentation Complete</p>
                    <p className="text-sm text-muted-foreground mt-1">All required documentation has been updated and is audit-ready.</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox checked={data.finalVerification.stakeholdersNotified} onCheckedChange={(v) => setData((prev) => ({ ...prev, finalVerification: { ...prev.finalVerification, stakeholdersNotified: v === true } }))} className="mt-0.5" />
                  <div>
                    <p className="font-medium">Stakeholders Notified</p>
                    <p className="text-sm text-muted-foreground mt-1">All relevant stakeholders have been informed of the closure and outcomes.</p>
                  </div>
                </label>
              </div>
              <div className="space-y-2 pt-4">
                <Label className="text-sm font-medium">Lessons Learned (Optional)</Label>
                <Textarea placeholder="Document key learnings to prevent similar issues in the future..." value={data.finalVerification.lessonsLearned} onChange={(e) => setData((prev) => ({ ...prev, finalVerification: { ...prev.finalVerification, lessonsLearned: e.target.value } }))} className="min-h-20" />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", path === "capa" && "bg-red-500", path === "correction" && "bg-blue-500", path === "preventive" && "bg-amber-500")}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight bg-clip-text text-transparent", path === "capa" && "bg-gradient-to-r from-red-600 to-rose-600", path === "correction" && "bg-gradient-to-r from-blue-600 to-cyan-600", path === "preventive" && "bg-gradient-to-r from-amber-600 to-orange-600")}>
          {config.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-muted-foreground flex-1">
              <span className="font-medium text-foreground">Problem Statement: </span>{problemStatement}
            </p>
            <Badge variant="outline" className={cn("shrink-0", riskScore <= 8 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
              Risk Score: {riskScore}/25
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/50 border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {phases.map((phase, idx) => {
              const PhaseIcon = phase.icon;
              const isActive = currentPhase === phase.id;
              const isComplete = isPhaseComplete(phase.id);
              return (
                <button
                  key={phase.id}
                  onClick={() => setCurrentPhase(phase.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-sm",
                    isActive && "bg-primary text-primary-foreground",
                    !isActive && isComplete && "bg-emerald-500/10 text-emerald-600",
                    !isActive && !isComplete && "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <PhaseIcon className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">{phase.label}</span>
                  <span className="md:hidden">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div key={currentPhase} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {renderPhaseContent()}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>Back to Triage</Button>
          {currentPhaseIndex > 0 && (
            <Button variant="outline" onClick={goToPrevPhase}>Previous Phase</Button>
          )}
        </div>
        <div className="flex gap-3">
          {currentPhaseIndex < phases.length - 1 ? (
            <Button onClick={goToNextPhase} className={cn("gap-2", config.buttonColor)}>
              Next Phase <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => onComplete(data)} disabled={!canSignOff} className={cn("gap-2", canSignOff && "bg-emerald-500 hover:bg-emerald-600")}>
              <CheckCircle2 className="w-4 h-4" />Sign-off & Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}