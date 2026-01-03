"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Pause,
  Activity,
  Eye,
  Calendar,
  Tag,
  Building2,
  FileText,
  Shield,
  History,
  ClipboardList,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventStatus = "open" | "in_progress" | "pending_review" | "closed" | "on_hold";
type ResolutionPath = "capa" | "correction" | "preventive" | "no_action";
type Priority = "critical" | "high" | "medium" | "low";
type WorkflowPhase = "intake" | "triage" | "resolution" | "complete";

interface QualityEvent {
  id: string;
  title: string;
  status: EventStatus;
  resolutionPath: ResolutionPath;
  priority: Priority;
  initiatedAt: Date;
  lastTouched: Date;
  owner: string;
  department: string;
  riskScore: number;
  dueDate: Date | null;
  phase: string;
  description: string;
  workflowPhase: WorkflowPhase;
}

const mockEvents: QualityEvent[] = [
  {
    id: "QE-2024-001",
    title: "Calibration deviation on production line A",
    status: "in_progress",
    resolutionPath: "capa",
    priority: "high",
    initiatedAt: new Date("2024-12-01T09:30:00"),
    lastTouched: new Date("2024-12-10T14:22:00"),
    owner: "Sarah Chen",
    department: "Production",
    riskScore: 16,
    dueDate: new Date("2024-12-20"),
    phase: "Root Cause Analysis",
    description: "Equipment calibration found outside acceptable limits during routine check. The deviation was detected during the morning shift inspection and requires immediate investigation to prevent potential product quality issues.",
    workflowPhase: "resolution",
  },
  {
    id: "QE-2024-002",
    title: "Documentation gap in SOP-042",
    status: "pending_review",
    resolutionPath: "correction",
    priority: "medium",
    initiatedAt: new Date("2024-12-03T11:15:00"),
    lastTouched: new Date("2024-12-09T16:45:00"),
    owner: "Michael Torres",
    department: "Quality Assurance",
    riskScore: 8,
    dueDate: new Date("2024-12-15"),
    phase: "Verification",
    description: "Missing step in sterilization procedure documentation. The gap was identified during an internal review and needs to be addressed before the next external audit.",
    workflowPhase: "resolution",
  },
  {
    id: "QE-2024-003",
    title: "Supplier material non-conformance",
    status: "open",
    resolutionPath: "capa",
    priority: "critical",
    initiatedAt: new Date("2024-12-08T08:00:00"),
    lastTouched: new Date("2024-12-10T11:30:00"),
    owner: "David Park",
    department: "Supply Chain",
    riskScore: 20,
    dueDate: new Date("2024-12-25"),
    phase: "Triage",
    description: "Raw material batch failed incoming inspection. Multiple quality parameters were outside specification limits. Supplier notification and corrective action required.",
    workflowPhase: "triage",
  },
  {
    id: "QE-2024-004",
    title: "Training record update required",
    status: "closed",
    resolutionPath: "no_action",
    priority: "low",
    initiatedAt: new Date("2024-11-15T13:20:00"),
    lastTouched: new Date("2024-11-28T09:10:00"),
    owner: "Emily Watson",
    department: "HR",
    riskScore: 4,
    dueDate: null,
    phase: "Complete",
    description: "Training completion dates need updating in system. Administrative update required to align records with actual completion dates.",
    workflowPhase: "complete",
  },
  {
    id: "QE-2024-005",
    title: "Environmental monitoring excursion",
    status: "in_progress",
    resolutionPath: "preventive",
    priority: "high",
    initiatedAt: new Date("2024-12-05T07:45:00"),
    lastTouched: new Date("2024-12-10T08:15:00"),
    owner: "Lisa Anderson",
    department: "Facilities",
    riskScore: 12,
    dueDate: new Date("2024-12-18"),
    phase: "Corrective Action",
    description: "Temperature excursion detected in clean room area. HVAC system malfunction caused temporary deviation from controlled environment parameters.",
    workflowPhase: "resolution",
  },
  {
    id: "QE-2024-006",
    title: "Customer complaint - packaging defect",
    status: "on_hold",
    resolutionPath: "capa",
    priority: "high",
    initiatedAt: new Date("2024-12-02T10:30:00"),
    lastTouched: new Date("2024-12-07T15:00:00"),
    owner: "James Wilson",
    department: "Customer Service",
    riskScore: 15,
    dueDate: new Date("2024-12-22"),
    phase: "Investigation",
    description: "Multiple reports of damaged packaging on shipment batch. Customer feedback indicates potential issues with packaging integrity during transit.",
    workflowPhase: "triage",
  },
  {
    id: "QE-2024-007",
    title: "Audit finding - process validation gap",
    status: "in_progress",
    resolutionPath: "capa",
    priority: "critical",
    initiatedAt: new Date("2024-11-28T14:00:00"),
    lastTouched: new Date("2024-12-10T10:45:00"),
    owner: "Robert Kim",
    department: "Quality Assurance",
    riskScore: 18,
    dueDate: new Date("2024-12-30"),
    phase: "Corrective Action",
    description: "Internal audit identified missing validation records. Process validation documentation needs to be updated to meet regulatory requirements.",
    workflowPhase: "resolution",
  },
  {
    id: "QE-2024-008",
    title: "Label printing error batch LB-4521",
    status: "closed",
    resolutionPath: "correction",
    priority: "medium",
    initiatedAt: new Date("2024-11-20T09:00:00"),
    lastTouched: new Date("2024-12-01T11:30:00"),
    owner: "Anna Martinez",
    department: "Packaging",
    riskScore: 10,
    dueDate: null,
    phase: "Complete",
    description: "Incorrect expiration date printed on product labels. Batch was quarantined and relabeling completed successfully.",
    workflowPhase: "complete",
  },
];

const statusConfig: Record<EventStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  open: { label: "Open", color: "text-blue-600", bgColor: "bg-blue-100", icon: CircleDot },
  in_progress: { label: "In Progress", color: "text-amber-600", bgColor: "bg-amber-100", icon: Activity },
  pending_review: { label: "Pending Review", color: "text-purple-600", bgColor: "bg-purple-100", icon: Eye },
  closed: { label: "Closed", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: CheckCircle2 },
  on_hold: { label: "On Hold", color: "text-slate-600", bgColor: "bg-slate-100", icon: Pause },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-500 text-white" },
  high: { label: "High", color: "bg-orange-500 text-white" },
  medium: { label: "Medium", color: "bg-yellow-500 text-yellow-900" },
  low: { label: "Low", color: "bg-slate-200 text-slate-700" },
};

const pathConfig: Record<ResolutionPath, { label: string; color: string }> = {
  capa: { label: "CAPA", color: "border-red-500/50 text-red-600 bg-red-50" },
  correction: { label: "Correction", color: "border-blue-500/50 text-blue-600 bg-blue-50" },
  preventive: { label: "Preventive", color: "border-amber-500/50 text-amber-600 bg-amber-50" },
  no_action: { label: "No Action", color: "border-slate-500/50 text-slate-600 bg-slate-50" },
};

const workflowSteps = [
  { id: "intake", label: "LASER Intake", description: "Problem Documentation", icon: ClipboardList },
  { id: "triage", label: "Triage & Risk", description: "NC & Risk Assessment", icon: GitBranch },
  { id: "resolution", label: "Resolution", description: "Execute Path", icon: ShieldCheck },
  { id: "complete", label: "Complete", description: "Record Closed", icon: CheckCircle2 },
];

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center">
        <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Event Not Found</h2>
          <p className="text-sm text-slate-500 mb-4">The quality event "{id}" could not be found.</p>
          <Link href="/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[event.status].icon;
  const isOverdue = event.dueDate && new Date(event.dueDate) < new Date() && event.status !== "closed";
  const currentPhaseIndex = workflowSteps.findIndex((s) => s.id === event.workflowPhase);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/events">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Events
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", statusConfig[event.status].bgColor)}>
                  <StatusIcon className={cn("w-5 h-5", statusConfig[event.status].color)} />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">{event.id}</h1>
                  <p className="text-xs text-slate-500">{statusConfig[event.status].label}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", pathConfig[event.resolutionPath].color)}>
                {pathConfig[event.resolutionPath].label}
              </Badge>
              <Badge className={cn("text-xs", priorityConfig[event.priority].color)}>
                {priorityConfig[event.priority].label}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  Workflow Progress
                </CardTitle>
                {event.workflowPhase !== "complete" && (
                  <Link href="/">
                    <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700">
                      <PlayCircle className="w-4 h-4" />
                      Continue Workflow
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {workflowSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === event.workflowPhase;
                  const isCompleted = idx < currentPhaseIndex;
                  const isFuture = idx > currentPhaseIndex;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all",
                            isActive && "bg-violet-600 text-white shadow-lg shadow-violet-200",
                            isCompleted && "bg-emerald-500 text-white",
                            isFuture && "bg-slate-100 text-slate-400"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <StepIcon className="w-6 h-6" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm font-medium text-center",
                          isActive && "text-violet-600",
                          isCompleted && "text-emerald-600",
                          isFuture && "text-slate-400"
                        )}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 text-center">{step.description}</p>
                      </div>
                      {idx < workflowSteps.length - 1 && (
                        <div className={cn(
                          "h-1 flex-1 mx-2 rounded-full -mt-6",
                          idx < currentPhaseIndex ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                <p className="text-slate-700">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Owner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
                      {event.owner.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{event.owner}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Department</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{event.department}</span>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Current Phase</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{event.phase}</span>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Risk Score</span>
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold",
                      event.riskScore >= 15
                        ? "bg-red-100 text-red-700"
                        : event.riskScore >= 10
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {event.riskScore}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Timeline & Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Initiated</p>
                    <p className="text-sm font-medium text-slate-900">{format(event.initiatedAt, "MMM d, yyyy")}</p>
                    <p className="text-xs text-slate-500">{format(event.initiatedAt, "HH:mm")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Last Touched</p>
                    <p className="text-sm font-medium text-slate-900">{formatDistanceToNow(event.lastTouched, { addSuffix: true })}</p>
                    <p className="text-xs text-slate-500">{format(event.lastTouched, "MMM d, yyyy HH:mm")}</p>
                  </div>
                </div>

                {event.dueDate && (
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isOverdue ? "bg-red-100" : "bg-emerald-100")}>
                      <AlertTriangle className={cn("w-5 h-5", isOverdue ? "text-red-600" : "text-emerald-600")} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Due Date</p>
                      <p className={cn("text-sm font-medium", isOverdue ? "text-red-600" : "text-slate-900")}>
                        {format(event.dueDate, "MMM d, yyyy")}
                      </p>
                      {isOverdue && <p className="text-xs text-red-500 font-medium">Overdue</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}