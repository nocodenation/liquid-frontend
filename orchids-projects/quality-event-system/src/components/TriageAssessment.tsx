"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

type ResolutionPath = "capa" | "correction" | "preventive" | null;

interface TriageResult {
  isNC: boolean;
  severity: number;
  occurrence: number;
  riskLevel: "acceptable" | "unacceptable";
  path: ResolutionPath;
  rationale: string;
}

interface TriageAssessmentProps {
  problemStatement: string;
  onComplete: (result: TriageResult) => void;
  onBack: () => void;
}

const CACHE_KEY = "triage-assessment-data";

// ... keep existing types and constants ...

interface CachedTriageData {
  isNC: boolean | null;
  severity: number | null;
  occurrence: number | null;
  rationale: string;
}

const loadFromCache = (): CachedTriageData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

const saveToCache = (data: CachedTriageData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
};

const severityLabels = [
  { level: 1, label: "Negligible", description: "No impact or minor inconvenience" },
  { level: 2, label: "Minor", description: "Small impact, easily corrected" },
  { level: 3, label: "Moderate", description: "Noticeable impact, requires action" },
  { level: 4, label: "Major", description: "Significant impact on quality/safety" },
  { level: 5, label: "Critical", description: "Severe impact, potential harm" },
];

const occurrenceLabels = [
  { level: 1, label: "Remote", description: "Unlikely to occur (< 1%)" },
  { level: 2, label: "Low", description: "Occasional occurrence (1-5%)" },
  { level: 3, label: "Moderate", description: "May occur sometimes (5-15%)" },
  { level: 4, label: "High", description: "Likely to occur (15-50%)" },
  { level: 5, label: "Very High", description: "Expected to occur (> 50%)" },
];

const getRiskColor = (severity: number, occurrence: number): string => {
  const score = severity * occurrence;
  if (score <= 4) return "bg-emerald-500";
  if (score <= 8) return "bg-lime-400";
  if (score <= 12) return "bg-yellow-400";
  if (score <= 16) return "bg-orange-500";
  return "bg-red-500";
};

const getRiskLevel = (severity: number, occurrence: number): "acceptable" | "unacceptable" => {
  const score = severity * occurrence;
  return score <= 8 ? "acceptable" : "unacceptable";
};

export function TriageAssessment({
  problemStatement,
  onComplete,
  onBack,
}: TriageAssessmentProps) {
  const [isNC, setIsNC] = useState<boolean | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [occurrence, setOccurrence] = useState<number | null>(null);
  const [rationale, setRationale] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const cached = loadFromCache();
    if (cached) {
      setIsNC(cached.isNC);
      setSeverity(cached.severity);
      setOccurrence(cached.occurrence);
      setRationale(cached.rationale);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveToCache({ isNC, severity, occurrence, rationale });
    }
  }, [isNC, severity, occurrence, rationale, isHydrated]);

  const riskLevel = useMemo(() => {
    if (severity === null || occurrence === null) return null;
    return getRiskLevel(severity, occurrence);
  }, [severity, occurrence]);

  const determinedPath = useMemo((): ResolutionPath => {
    if (isNC === null || riskLevel === null) return null;
    if (isNC && riskLevel === "unacceptable") return "capa";
    if (isNC && riskLevel === "acceptable") return "correction";
    if (!isNC && riskLevel === "unacceptable") return "preventive";
    return null;
  }, [isNC, riskLevel]);

  const canProceed = useMemo(() => {
    if (determinedPath === "correction") {
      return rationale.length >= 20;
    }
    return determinedPath !== null;
  }, [determinedPath, rationale]);

  const handleProceed = () => {
    if (severity === null || occurrence === null || isNC === null || determinedPath === null) return;
    onComplete({
      isNC,
      severity,
      occurrence,
      riskLevel: riskLevel!,
      path: determinedPath,
      rationale,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Triage & Risk Assessment
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluate the event and determine the appropriate resolution path
        </p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Problem Statement: </span>
            {problemStatement}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Non-Conformity Determination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Does this event represent a deviation from requirements, specifications, or standards?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsNC(true)}
                  className={cn(
                    "p-6 rounded-xl border-2 text-center transition-all duration-200",
                    isNC === true
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-destructive/50"
                  )}
                >
                  <XCircle
                    className={cn(
                      "w-10 h-10 mx-auto mb-2",
                      isNC === true ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <p className="font-semibold">Yes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Non-Conformity (NC)
                  </p>
                </button>
                <button
                  onClick={() => setIsNC(false)}
                  className={cn(
                    "p-6 rounded-xl border-2 text-center transition-all duration-200",
                    isNC === false
                      ? "border-amber-500 bg-amber-500/5"
                      : "border-border hover:border-amber-500/50"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-10 h-10 mx-auto mb-2",
                      isNC === false ? "text-amber-500" : "text-muted-foreground"
                    )}
                  />
                  <p className="font-semibold">No</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Potential Issue Only
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                Risk / Recurrence Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-8 flex flex-col items-center justify-center">
                  <div className="flex-1 flex items-center justify-center -rotate-90 whitespace-nowrap">
                    <span className="text-xs font-medium text-muted-foreground tracking-wider">
                      SEVERITY
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-6 gap-1">
                    <div />
                    {[1, 2, 3, 4, 5].map((o) => (
                      <Tooltip key={`occ-${o}`}>
                        <TooltipTrigger asChild>
                          <div className="text-center py-2 text-xs font-medium text-muted-foreground cursor-help">
                            {o}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{occurrenceLabels[o - 1].label}</p>
                          <p className="text-xs text-muted-foreground">
                            {occurrenceLabels[o - 1].description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {[5, 4, 3, 2, 1].map((s) => (
                      <Fragment key={`sev-row-${s}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center text-xs font-medium text-muted-foreground cursor-help">
                              {s}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{severityLabels[s - 1].label}</p>
                            <p className="text-xs text-muted-foreground">
                              {severityLabels[s - 1].description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {[1, 2, 3, 4, 5].map((o) => (
                          <button
                            key={`${s}-${o}`}
                            onClick={() => {
                              setSeverity(s);
                              setOccurrence(o);
                            }}
                            className={cn(
                              "aspect-square rounded-lg transition-all duration-200",
                              getRiskColor(s, o),
                              severity === s && occurrence === o
                                ? "ring-4 ring-foreground ring-offset-2 ring-offset-background scale-110 z-10"
                                : "opacity-70 hover:opacity-100 hover:scale-105"
                            )}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs font-medium text-muted-foreground tracking-wider">
                      OCCURRENCE
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span>1-4</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-lime-400" />
                  <span>5-8</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span>9-12</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span>13-16</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>17-25</span>
                </div>
              </div>

              {severity !== null && occurrence !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-muted/50 border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Risk Score</p>
                      <p className="text-2xl font-bold">
                        {severity * occurrence}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}/ 25
                        </span>
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-sm px-4 py-1.5",
                        riskLevel === "acceptable"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      )}
                      variant="outline"
                    >
                      {riskLevel === "acceptable" ? "Acceptable Risk" : "Unacceptable Risk"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Severity: <strong className="text-foreground">{severityLabels[severity - 1].label}</strong>
                    </span>
                    <span>×</span>
                    <span>
                      Occurrence: <strong className="text-foreground">{occurrenceLabels[occurrence - 1].label}</strong>
                    </span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Resolution Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {determinedPath === null ? (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 rounded-xl bg-muted/50 border border-dashed text-center"
                  >
                    <Info className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Awaiting Assessment</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete the NC determination and risk matrix to see the resolution path
                    </p>
                  </motion.div>
                ) : determinedPath === "capa" ? (
                  <motion.div
                    key="capa"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border-2 border-red-500/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <Badge className="bg-red-500 text-white mb-2">CAPA Required</Badge>
                        <h4 className="text-lg font-bold">CAPA Investigation</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          This event requires a formal Corrective and Preventive Action (CAPA) investigation
                          including root cause analysis, systemic corrective actions, and effectiveness verification.
                        </p>
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-xs font-medium text-red-600">
                            NC Confirmed + Unacceptable Risk = Full Investigation Required
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : determinedPath === "correction" ? (
                  <motion.div
                    key="correction"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <Badge className="bg-blue-500 text-white mb-2">Correction Path</Badge>
                        <h4 className="text-lg font-bold">Correction Only</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          While this is a confirmed Non-Conformity, the risk level is acceptable.
                          You may proceed with immediate correction without a full CAPA investigation.
                        </p>
                        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs font-medium text-blue-600">
                            NC Confirmed + Acceptable Risk = Correction with Rationale
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-blue-500/20">
                      <Label className="text-sm font-medium">
                        Rationale Statement
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        Explain why a full CAPA investigation is not required for this event
                      </p>
                      <Textarea
                        placeholder="Based on the risk assessment, a full CAPA is not warranted because..."
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        className="min-h-24 border-blue-500/30 focus:border-blue-500"
                      />
                      {rationale.length > 0 && rationale.length < 20 && (
                        <p className="text-xs text-destructive mt-2">
                          Please provide a more detailed rationale (minimum 20 characters)
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : determinedPath === "preventive" ? (
                  <motion.div
                    key="preventive"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <Badge className="bg-amber-500 text-white mb-2">Preventive Path</Badge>
                        <h4 className="text-lg font-bold">Preventive Action Only</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          While not a confirmed NC, the potential risk is unacceptable.
                          Preventive actions are required to mitigate future occurrence.
                        </p>
                        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs font-medium text-amber-600">
                            Not NC + Unacceptable Risk = Preventive Action Required
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <Badge className="bg-emerald-500 text-white mb-2">No Action Required</Badge>
                        <h4 className="text-lg font-bold">Close Record</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          This event does not represent an NC and the risk is acceptable.
                          The record can be closed after documentation.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" onClick={onBack}>
              Back to Intake
            </Button>
            <Button
              onClick={handleProceed}
              disabled={!canProceed}
              className={cn(
                "gap-2",
                determinedPath === "capa" && "bg-red-500 hover:bg-red-600",
                determinedPath === "correction" && "bg-blue-500 hover:bg-blue-600",
                determinedPath === "preventive" && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              Proceed to Resolution
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}