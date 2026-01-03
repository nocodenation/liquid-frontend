"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Anchor,
  ArrowLeftRight,
  AlertTriangle,
  Eye,
  Sparkles,
  Upload,
  Search,
  Check,
  ChevronDown,
  FileText,
  Calendar,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CACHE_KEY = "laser-wizard-data";

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

interface CachedData {
  data: Omit<LaserData, 'locate'> & { locate: Omit<LaserData['locate'], 'files'> };
  activeStep: number;
  problemStatement: string;
}

interface LaserWizardProps {
  onComplete: (data: LaserData, problemStatement: string) => void;
  onDataUpdate?: (data: LaserData) => void;
}

const steps = [
  {
    id: "L",
    title: "Locate",
    subtitle: "What, Where, When, Who",
    icon: MapPin,
    color: "from-[#8b5cf6] to-[#8b5cf6]",
  },
  {
    id: "A",
    title: "Anchor",
    subtitle: "Link to Reference Document",
    icon: Anchor,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "S",
    title: "State the Gap",
    subtitle: "Expected vs. Actual",
    icon: ArrowLeftRight,
    color: "from-teal-500 to-emerald-500",
  },
  {
    id: "E",
    title: "Explain Impact",
    subtitle: "Risk Classification",
    icon: AlertTriangle,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "R",
    title: "Reveal Mechanism",
    subtitle: "How It Manifested",
    icon: Eye,
    color: "from-rose-500 to-pink-500",
  },
];

const documentTypes = [
  { value: "sop", label: "Standard Operating Procedure (SOP)" },
  { value: "spec", label: "Product Specification" },
  { value: "regulatory", label: "Regulatory Requirement" },
  { value: "contract", label: "Customer Contract" },
  { value: "internal", label: "Internal Policy" },
];

const impactTypes = [
  {
    value: "patient-safety",
    label: "Patient Safety",
    description: "Direct impact on patient health or safety",
  },
  {
    value: "compliance",
    label: "Regulatory Compliance",
    description: "Violation of regulatory requirements",
  },
  {
    value: "product-quality",
    label: "Product Quality",
    description: "Impact on product specifications or performance",
  },
  {
    value: "operational",
    label: "Operational",
    description: "Internal process or efficiency impact",
  },
];

const getInitialData = (): LaserData => ({
  locate: { what: "", where: "", when: "", who: "", files: [] },
  anchor: { documentType: "", documentId: "", section: "" },
  stateGap: { expected: "", actual: "" },
  explainImpact: { impactType: "", isRecurring: false },
  revealMechanism: { description: "" },
});

const loadFromCache = (): { data: LaserData; activeStep: number; problemStatement: string } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      return {
        data: {
          ...parsed.data,
          locate: { ...parsed.data.locate, files: [] },
        },
        activeStep: parsed.activeStep,
        problemStatement: parsed.problemStatement,
      };
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

const saveToCache = (data: LaserData, activeStep: number, problemStatement: string) => {
  if (typeof window === 'undefined') return;
  try {
    const toCache: CachedData = {
      data: {
        locate: { what: data.locate.what, where: data.locate.where, when: data.locate.when, who: data.locate.who },
        anchor: data.anchor,
        stateGap: data.stateGap,
        explainImpact: data.explainImpact,
        revealMechanism: data.revealMechanism,
      },
      activeStep,
      problemStatement,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  } catch {
    // Ignore cache errors
  }
};

const clearCache = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore cache errors
  }
};

export function LaserWizard({ onComplete, onDataUpdate }: LaserWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [problemStatement, setProblemStatement] = useState("");
  const [data, setData] = useState<LaserData>(getInitialData);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const cached = loadFromCache();
    if (cached) {
      setData(cached.data);
      setActiveStep(cached.activeStep);
      setProblemStatement(cached.problemStatement);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveToCache(data, activeStep, problemStatement);
    }
  }, [data, activeStep, problemStatement, isHydrated]);

  useEffect(() => {
    onDataUpdate?.(data);
  }, [data, onDataUpdate]);

  const updateData = <K extends keyof LaserData>(
    step: K,
    field: keyof LaserData[K],
    value: LaserData[K][keyof LaserData[K]]
  ) => {
    setData((prev) => ({
      ...prev,
      [step]: { ...prev[step], [field]: value },
    }));
  };

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return !!(data.locate.what && data.locate.where && data.locate.when);
      case 1:
        return !!(data.anchor.documentType && data.anchor.documentId);
      case 2:
        return !!(data.stateGap.expected && data.stateGap.actual);
      case 3:
        return !!data.explainImpact.impactType;
      case 4:
        return !!data.revealMechanism.description;
      default:
        return false;
    }
  };

  const handleStepComplete = () => {
    if (isStepValid(activeStep)) {
      if (!completedSteps.includes(activeStep)) {
        setCompletedSteps((prev) => [...prev, activeStep]);
      }
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const generateProblemStatement = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const impactLabel = impactTypes.find(
        (t) => t.value === data.explainImpact.impactType
      )?.label;
      const docTypeLabel = documentTypes.find(
        (t) => t.value === data.anchor.documentType
      )?.label;

      const statement = `On ${data.locate.when}, ${data.locate.what} was identified at ${data.locate.where}${data.locate.who ? ` by ${data.locate.who}` : ""}. Per ${docTypeLabel} ${data.anchor.documentId}${data.anchor.section ? ` (${data.anchor.section})` : ""}, the expected behavior is "${data.stateGap.expected}", however the actual observed behavior was "${data.stateGap.actual}". This represents a ${impactLabel} impact${data.explainImpact.isRecurring ? " with recurring potential" : " (isolated incident)"}. The issue manifested through: ${data.revealMechanism.description}`;

      setProblemStatement(statement);
      setIsGenerating(false);
    }, 1500);
  };

  const allStepsComplete = steps.every((_, idx) => isStepValid(idx));

  const handleComplete = () => {
    onComplete(data, problemStatement);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      <div className="lg:w-80 shrink-0">
        <div className="sticky top-6 space-y-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#8b5cf6]">
              LASER Framework
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Guided problem documentation
            </p>
          </div>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            const isCompleted = completedSteps.includes(idx);
            const isValid = isStepValid(idx);

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300",
                  isActive
                    ? "bg-card shadow-lg shadow-primary/10 border border-primary/20"
                    : "hover:bg-card/50"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    isActive
                      ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                      : isCompleted
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </span>
                    <span
                      className={cn(
                        "font-semibold truncate",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {step.subtitle}
                  </p>
                </div>
                {isValid && (
                  <Badge
                    variant="outline"
                    className="shrink-0 bg-success/10 text-success border-success/20"
                  >
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeStep === 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-[#8b5cf6] flex items-center justify-center text-white">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          Locate the Event
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Document the specifics: What happened, where, when,
                          and who was involved?
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="what"
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-[#8b5cf6]" />
                          What was observed?
                          <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="what"
                          placeholder="Describe the specific observation or finding..."
                          value={data.locate.what}
                          onChange={(e) =>
                            updateData("locate", "what", e.target.value)
                          }
                          className="min-h-24"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="where"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <Building className="w-4 h-4 text-[#8b5cf6]" />
                            Where did it occur?
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="where"
                            placeholder="Location, department, line..."
                            value={data.locate.where}
                            onChange={(e) =>
                              updateData("locate", "where", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="when"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-[#8b5cf6]" />
                            When was it discovered?
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="when"
                            type="date"
                            value={data.locate.when}
                            onChange={(e) =>
                              updateData("locate", "when", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="who"
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-[#8b5cf6]" />
                          Who identified it? (Optional)
                        </Label>
                        <Input
                          id="who"
                          placeholder="Name or role of the reporter..."
                          value={data.locate.who}
                          onChange={(e) =>
                            updateData("locate", "who", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4 text-[#8b5cf6]" />
                          Objective Evidence
                        </Label>
                        <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop files or click to upload
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Photos, documents, logs (Max 10MB each)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                        <Anchor className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          Anchor to Requirements
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Link this event to the controlling document that
                          defines the expected state.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Document Type
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={data.anchor.documentType}
                          onValueChange={(v) =>
                            updateData("anchor", "documentType", v)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select document type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Document ID / Reference
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search or enter document ID..."
                            className="pl-10"
                            value={data.anchor.documentId}
                            onChange={(e) =>
                              updateData("anchor", "documentId", e.target.value)
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          e.g., SOP-QC-001, ISO 13485:2016 §7.5.6
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Specific Section / Clause (Optional)
                        </Label>
                        <Input
                          placeholder="Section 4.2, Clause 7.5.6..."
                          value={data.anchor.section}
                          onChange={(e) =>
                            updateData("anchor", "section", e.target.value)
                          }
                        />
                      </div>

                      {data.anchor.documentId && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">
                                Referenced Document
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {
                                  documentTypes.find(
                                    (t) => t.value === data.anchor.documentType
                                  )?.label
                                }{" "}
                                - {data.anchor.documentId}
                                {data.anchor.section &&
                                  ` (${data.anchor.section})`}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white">
                        <ArrowLeftRight className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">State the Gap</h3>
                        <p className="text-sm text-muted-foreground">
                          Clearly articulate the difference between what should
                          have happened and what actually occurred.
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-success" />
                          <Label className="text-sm font-medium">
                            Expected Behavior (Should Be)
                            <span className="text-destructive">*</span>
                          </Label>
                        </div>
                        <Textarea
                          placeholder="Per the referenced document, the expected state or behavior is..."
                          value={data.stateGap.expected}
                          onChange={(e) =>
                            updateData("stateGap", "expected", e.target.value)
                          }
                          className="min-h-32 border-success/30 focus:border-success"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-destructive" />
                          <Label className="text-sm font-medium">
                            Actual Behavior (Was)
                            <span className="text-destructive">*</span>
                          </Label>
                        </div>
                        <Textarea
                          placeholder="However, what was actually observed was..."
                          value={data.stateGap.actual}
                          onChange={(e) =>
                            updateData("stateGap", "actual", e.target.value)
                          }
                          className="min-h-32 border-destructive/30 focus:border-destructive"
                        />
                      </div>
                    </div>

                    {data.stateGap.expected && data.stateGap.actual && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-xl bg-gradient-to-r from-success/5 via-transparent to-destructive/5 border"
                      >
                        <h4 className="font-semibold mb-4 text-center">
                          Gap Analysis
                        </h4>
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex-1 p-4 rounded-lg bg-success/10 border border-success/20">
                            <p className="text-xs font-medium text-success mb-1">
                              EXPECTED
                            </p>
                            <p className="text-sm line-clamp-3">
                              {data.stateGap.expected}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-xs font-medium text-destructive mb-1">
                              ACTUAL
                            </p>
                            <p className="text-sm line-clamp-3">
                              {data.stateGap.actual}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Explain Impact</h3>
                        <p className="text-sm text-muted-foreground">
                          Classify the type and scope of impact this event
                          represents.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Impact Category
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {impactTypes.map((type) => (
                            <button
                              key={type.value}
                              onClick={() =>
                                updateData(
                                  "explainImpact",
                                  "impactType",
                                  type.value
                                )
                              }
                              className={cn(
                                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                                data.explainImpact.impactType === type.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <p className="font-semibold text-sm">
                                {type.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {type.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/50 border">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Magnitude Assessment
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Is this an isolated incident or a recurring
                              pattern?
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-sm",
                                !data.explainImpact.isRecurring
                                  ? "font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              Single Event
                            </span>
                            <Switch
                              checked={data.explainImpact.isRecurring}
                              onCheckedChange={(v) =>
                                updateData("explainImpact", "isRecurring", v)
                              }
                            />
                            <span
                              className={cn(
                                "text-sm",
                                data.explainImpact.isRecurring
                                  ? "font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              Recurring
                            </span>
                          </div>
                        </div>
                      </div>

                      {data.explainImpact.impactType && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-xl border",
                            data.explainImpact.impactType === "patient-safety"
                              ? "bg-destructive/10 border-destructive/20"
                              : data.explainImpact.impactType === "compliance"
                                ? "bg-amber-500/10 border-amber-500/20"
                                : "bg-blue-500/10 border-blue-500/20"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className={cn(
                                "w-5 h-5",
                                data.explainImpact.impactType ===
                                  "patient-safety"
                                  ? "text-destructive"
                                  : data.explainImpact.impactType ===
                                      "compliance"
                                    ? "text-amber-500"
                                    : "text-blue-500"
                              )}
                            />
                            <p className="font-medium text-sm">
                              {
                                impactTypes.find(
                                  (t) =>
                                    t.value === data.explainImpact.impactType
                                )?.label
                              }{" "}
                              Impact -{" "}
                              {data.explainImpact.isRecurring
                                ? "Recurring Pattern"
                                : "Isolated Incident"}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white">
                        <Eye className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Reveal Mechanism</h3>
                        <p className="text-sm text-muted-foreground">
                          Describe how this issue came to light and any
                          observable patterns.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        How did this issue manifest?
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder="Describe the mechanism of discovery, any observable symptoms, patterns, or triggers that led to identifying this issue..."
                        value={data.revealMechanism.description}
                        onChange={(e) =>
                          updateData(
                            "revealMechanism",
                            "description",
                            e.target.value
                          )
                        }
                        className="min-h-40"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include details about how the issue was detected
                        (inspection, audit, customer complaint, etc.)
                      </p>
                    </div>

                    {allStepsComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-6 border-t"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">
                              Generate Problem Statement
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              AI will synthesize your inputs into a
                              professional statement
                            </p>
                          </div>
                          <Button
                            onClick={generateProblemStatement}
                            disabled={isGenerating}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            {isGenerating ? "Generating..." : "AI Assist"}
                          </Button>
                        </div>

                        {problemStatement && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-primary">
                                Generated Problem Statement
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                              {problemStatement}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <div className="flex gap-3">
                {activeStep < steps.length - 1 ? (
                  <Button
                    onClick={handleStepComplete}
                    disabled={!isStepValid(activeStep)}
                    className="gap-2"
                  >
                    Continue
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!allStepsComplete || !problemStatement}
                    className="gap-2 bg-[#8b5cf6] hover:bg-[#7c4fe0]"
                  >
                    Proceed to Triage
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}