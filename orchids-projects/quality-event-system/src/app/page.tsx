"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  GitBranch,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Activity,
  ChevronRight,
  FileSearch,
  RotateCcw,
  BarChart3,
  X,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LaserWizard } from "@/components/LaserWizard";
import { TriageAssessment } from "@/components/TriageAssessment";
import { ResolutionWorkspace } from "@/components/ResolutionWorkspace";
import { AIChatSidebar } from "@/components/AIChatSidebar";
import { cn } from "@/lib/utils";
import { nifiClient, createQualityEventPayload } from "@/lib/nifi-client";

type WorkflowPhase = "intake" | "triage" | "resolution" | "complete";
type ResolutionPath = "capa" | "correction" | "preventive";

interface TriageResultFromComponent {
  isNC: boolean;
  severity: number;
  occurrence: number;
  riskLevel: "acceptable" | "unacceptable";
  path: ResolutionPath | null;
  rationale: string;
}

interface LaserData {
  locate: {
    what: string;
    where: string;
    when: string;
    who: string;
    files: File[];
  };
  anchor: {
    documentType: string;
    documentId: string;
    section: string;
  };
  stateGap: {
    expected: string;
    actual: string;
  };
  explainImpact: {
    impactType: string;
    isRecurring: boolean;
  };
  revealMechanism: {
    description: string;
  };
}

interface WorkflowState {
  phase: WorkflowPhase;
  problemStatement: string;
  laserData: LaserData | null;
  triageResult: {
    isNC: boolean;
    severity: number;
    occurrence: number;
    riskLevel: "acceptable" | "unacceptable";
    path: ResolutionPath;
    rationale: string;
  } | null;
  resolutionData: {
    correction: string;
    containment: { applicable: boolean; measures: string };
    verification: { fixEffective: boolean; noNewRisks: boolean; documentsUpdated: boolean };
  };
}

const clearAllCaches = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem("laser-wizard-data");
    localStorage.removeItem("triage-assessment-data");
    localStorage.removeItem("resolution-workspace-data");
  } catch {
    // Ignore cache errors
  }
};

const phaseSteps = [
  {
    id: "intake",
    label: "LASER Intake",
    description: "Problem Documentation",
    icon: ClipboardList,
  },
  {
    id: "triage",
    label: "Triage & Risk",
    description: "NC & Risk Assessment",
    icon: GitBranch,
  },
  {
    id: "resolution",
    label: "Resolution",
    description: "Execute Path",
    icon: ShieldCheck,
  },
  {
    id: "complete",
    label: "Complete",
    description: "Record Closed",
    icon: CheckCircle2,
  },
];

export default function QualityEventSystem() {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    phase: "intake",
    problemStatement: "",
    laserData: null,
    triageResult: null,
    resolutionData: {
      correction: "",
      containment: { applicable: true, measures: "" },
      verification: { fixEffective: false, noNewRisks: false, documentsUpdated: false },
    },
  });
  const [chatOpen, setChatOpen] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chatContext = useMemo(() => {
    if (workflow.phase === "intake") {
      return {
        phase: "intake" as const,
        data: workflow.laserData ? {
          locate: workflow.laserData.locate,
          anchor: workflow.laserData.anchor,
          stateGap: workflow.laserData.stateGap,
          explainImpact: workflow.laserData.explainImpact,
          revealMechanism: workflow.laserData.revealMechanism,
        } : {},
      };
    }
    if (workflow.phase === "triage") {
      return {
        phase: "triage" as const,
        data: workflow.triageResult ? {
          isNC: workflow.triageResult.isNC,
          severity: workflow.triageResult.severity,
          occurrence: workflow.triageResult.occurrence,
          rationale: workflow.triageResult.rationale,
        } : {},
      };
    }
    return {
      phase: "resolution" as const,
      data: {
        ...workflow.resolutionData,
        path: workflow.triageResult?.path,
      },
    };
  }, [workflow]);

  const handleLaserComplete = async (data: LaserData, problemStatement: string) => {
    try {
      // Generate event ID on first submission if not already set
      const generatedEventId = eventId || nifiClient.generateEventId();
      if (!eventId) {
        setEventId(generatedEventId);
      }

      // Submit LASER stage data to NiFi
      const loadingToast = toast.loading("Saving LASER data...");
      const response = await nifiClient.submitLaserStage(generatedEventId, data, problemStatement);
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success("LASER data saved successfully", {
          description: `Event ID: ${generatedEventId}`,
          duration: 3000,
        });

        // Update local state and proceed to next phase
        setWorkflow((prev) => ({
          ...prev,
          phase: "triage",
          problemStatement,
          laserData: data,
        }));
      } else {
        throw new Error(response.message || "Failed to save LASER data");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to save LASER data", {
        description: errorMessage,
        duration: 5000,
      });
      console.error("LASER submission error:", error);
    }
  };

  const handleLaserDataUpdate = useCallback((data: LaserData) => {
    setWorkflow((prev) => ({
      ...prev,
      laserData: data,
    }));
  }, []);

  const handleTriageComplete = async (result: TriageResultFromComponent) => {
    if (!result || !result.path) return;

    try {
      if (!eventId) {
        throw new Error("Event ID not found. Please complete LASER stage first.");
      }

      // Submit Triage stage data to NiFi
      const loadingToast = toast.loading("Saving Triage data...");
      const response = await nifiClient.submitTriageStage(eventId, result);
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success("Triage data saved successfully", {
          duration: 3000,
        });

        // Update local state and proceed to next phase
        setWorkflow((prev) => ({
          ...prev,
          phase: "resolution",
          triageResult: {
            ...result,
            path: result.path as ResolutionPath,
          },
        }));
      } else {
        throw new Error(response.message || "Failed to save Triage data");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to save Triage data", {
        description: errorMessage,
        duration: 5000,
      });
      console.error("Triage submission error:", error);
    }
  };

  const handleResolutionComplete = async (resolutionData: any) => {
    // Don't proceed if already submitting
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (!eventId) {
        throw new Error("Event ID not found. Please complete LASER and Triage stages first.");
      }

      // Update workflow state with resolution data
      setWorkflow((prev) => ({
        ...prev,
        resolutionData,
      }));

      // Submit complete quality event with all stages aggregated
      const loadingToast = toast.loading("Completing quality event...");

      // Create complete payload with all workflow data
      const completePayload = createQualityEventPayload(
        eventId,
        workflow.laserData,
        workflow.problemStatement,
        workflow.triageResult,
        resolutionData
      );

      const response = await nifiClient.submitQualityEvent(completePayload);
      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(`Quality event ${eventId} completed successfully!`, {
          description: "Your event has been finalized and accepted by NiFi.",
          duration: 5000,
        });

        // Clear caches and transition to complete phase
        clearAllCaches();
        setWorkflow((prev) => ({
          ...prev,
          phase: "complete",
        }));
      } else {
        throw new Error(response.message || "Failed to complete quality event");
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      if (errorMessage.includes("Cannot connect")) {
        toast.error("Cannot connect to NiFi Gateway", {
          description: "Make sure the NiFi Gateway is running on http://localhost:5050",
          duration: 7000,
        });
      } else if (errorMessage.includes("timeout")) {
        toast.error("Request timeout", {
          description: "NiFi Gateway took too long to respond. Please try again.",
          duration: 7000,
        });
      } else {
        toast.error("Failed to submit quality event", {
          description: errorMessage,
          duration: 7000,
        });
      }

      console.error("NiFi submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    clearAllCaches();
    setEventId(null); // Reset event ID for new quality event
    setWorkflow({
      phase: "intake",
      problemStatement: "",
      laserData: null,
      triageResult: null,
      resolutionData: {
        correction: "",
        containment: { applicable: true, measures: "" },
        verification: { fixEffective: false, noNewRisks: false, documentsUpdated: false },
      },
    });
  };

  const currentPhaseIndex = phaseSteps.findIndex((s) => s.id === workflow.phase);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <AIChatSidebar
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        context={chatContext}
      />

      {/* Record Detail Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-emerald-500" />
              Quality Event Record
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-600">Record Closed</p>
                  <p className="text-sm text-muted-foreground">
                    Completed on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-white">Closed</Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-muted/30">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Problem Statement</h4>
                <p className="text-sm">{workflow.problemStatement || "No problem statement recorded"}</p>
              </div>

              {workflow.laserData && (
                <div className="p-4 rounded-xl border bg-muted/30">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">LASER Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">What: </span>
                      <span>{workflow.laserData.locate.what || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Where: </span>
                      <span>{workflow.laserData.locate.where || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">When: </span>
                      <span>{workflow.laserData.locate.when || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Who: </span>
                      <span>{workflow.laserData.locate.who || "N/A"}</span>
                    </div>
                  </div>
                  {workflow.laserData.stateGap && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span>{workflow.laserData.stateGap.expected || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual: </span>
                          <span>{workflow.laserData.stateGap.actual || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {workflow.triageResult && (
                <div className="p-4 rounded-xl border bg-muted/30">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Triage Assessment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "w-4 h-4",
                        workflow.triageResult.isNC ? "text-destructive" : "text-amber-500"
                      )} />
                      <span className="text-sm">
                        {workflow.triageResult.isNC ? "Non-Conformity Confirmed" : "No Non-Conformity"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        "w-4 h-4",
                        workflow.triageResult.riskLevel === "acceptable" ? "text-emerald-500" : "text-red-500"
                      )} />
                      <span className="text-sm">
                        Risk Score: {workflow.triageResult.severity * workflow.triageResult.occurrence}/25
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <Badge className={cn(
                      workflow.triageResult.path === "capa" && "bg-red-500",
                      workflow.triageResult.path === "correction" && "bg-blue-500",
                      workflow.triageResult.path === "preventive" && "bg-amber-500"
                    )}>
                      Resolution Path: {workflow.triageResult.path?.toUpperCase()}
                    </Badge>
                  </div>
                  {workflow.triageResult.rationale && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Rationale:</p>
                      <p className="text-sm mt-1">{workflow.triageResult.rationale}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-xl border bg-muted/30">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Verification Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Correction Effectiveness Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>No New Risks Introduced</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Documentation Updated</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowRecordModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn("transition-all duration-300", chatOpen ? "pl-80" : "pl-0")}>
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">QualityFlow</h1>
                  <p className="text-xs text-muted-foreground">
                    Event Handling & CAPA System
                  </p>
                </div>
                <div className="h-6 w-px bg-border ml-2" />
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Events
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <nav className="hidden lg:flex items-center gap-1">
                  {phaseSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = step.id === workflow.phase;
                    const isCompleted = idx < currentPhaseIndex;
                    const isFuture = idx > currentPhaseIndex;

                    return (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                            isActive && "bg-primary/10",
                            isCompleted && "text-emerald-500",
                            isFuture && "text-muted-foreground/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                              isActive &&
                                "bg-primary text-primary-foreground",
                              isCompleted && "bg-emerald-500/10",
                              isFuture && "bg-muted"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="hidden xl:block">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isFuture && "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </p>
                          </div>
                        </div>
                        {idx < phaseSteps.length - 1 && (
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 mx-1",
                              idx < currentPhaseIndex
                                ? "text-emerald-500"
                                : "text-muted-foreground/30"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </nav>

                <Badge variant="outline" className="hidden md:flex gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      workflow.phase === "complete"
                        ? "bg-emerald-500"
                        : "bg-amber-500 animate-pulse"
                    )}
                  />
                  {workflow.phase === "complete" ? "Closed" : "In Progress"}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {workflow.phase === "intake" && (
              <motion.div
                key="intake"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LaserWizard onComplete={handleLaserComplete} onDataUpdate={handleLaserDataUpdate} />
              </motion.div>
            )}

            {workflow.phase === "triage" && (
              <motion.div
                key="triage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TriageAssessment
                  problemStatement={workflow.problemStatement}
                  onComplete={handleTriageComplete}
                  onBack={() =>
                    setWorkflow((prev) => ({ ...prev, phase: "intake" }))
                  }
                />
              </motion.div>
            )}

            {workflow.phase === "resolution" && workflow.triageResult && (
              <motion.div
                key="resolution"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ResolutionWorkspace
                  path={workflow.triageResult.path}
                  problemStatement={workflow.problemStatement}
                  riskScore={
                    workflow.triageResult.severity * workflow.triageResult.occurrence
                  }
                  rationale={workflow.triageResult.rationale}
                  onComplete={handleResolutionComplete}
                  onBack={() =>
                    setWorkflow((prev) => ({ ...prev, phase: "triage" }))
                  }
                />
              </motion.div>
            )}

            {workflow.phase === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-2xl mx-auto"
              >
                <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(16,185,129,0.15),transparent_70%)]" />
                  <CardContent className="p-12 text-center relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h2 className="text-3xl font-bold mb-2">Record Closed</h2>
                      <p className="text-muted-foreground mb-8">
                        The quality event has been successfully resolved and documented.
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-card border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Resolution Path
                          </p>
                          <p className="font-semibold capitalize">
                            {workflow.triageResult?.path}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-card border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Risk Score
                          </p>
                          <p className="font-semibold">
                            {workflow.triageResult
                              ? workflow.triageResult.severity *
                                workflow.triageResult.occurrence
                              : 0}
                            /25
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center gap-4">
                        <Button variant="outline" className="gap-2" onClick={() => setShowRecordModal(true)}>
                          <FileSearch className="w-4 h-4" />
                          View Record
                        </Button>
                        <Button onClick={handleReset} className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          New Event
                        </Button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-center"
                >
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Compliant with ISO 13485 and 21 CFR Part 820 requirements
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}