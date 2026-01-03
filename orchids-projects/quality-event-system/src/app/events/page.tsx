"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Pause,
  FileText,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  Calendar,
  Tag,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventStatus = "open" | "in_progress" | "pending_review" | "closed" | "on_hold";
type ResolutionPath = "capa" | "correction" | "preventive" | "no_action";
type Priority = "critical" | "high" | "medium" | "low";

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
    description: "Equipment calibration found outside acceptable limits during routine check",
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
    description: "Missing step in sterilization procedure documentation",
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
    description: "Raw material batch failed incoming inspection",
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
    description: "Training completion dates need updating in system",
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
    description: "Temperature excursion detected in clean room area",
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
    description: "Multiple reports of damaged packaging on shipment batch",
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
    description: "Internal audit identified missing validation records",
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
    description: "Incorrect expiration date printed on product labels",
  },
];

const statusConfig: Record<EventStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: "Open", color: "bg-blue-500", icon: CircleDot },
  in_progress: { label: "In Progress", color: "bg-amber-500", icon: Activity },
  pending_review: { label: "Pending Review", color: "bg-purple-500", icon: Eye },
  closed: { label: "Closed", color: "bg-emerald-500", icon: CheckCircle2 },
  on_hold: { label: "On Hold", color: "bg-slate-500", icon: Pause },
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

type SortField = "id" | "title" | "status" | "priority" | "initiatedAt" | "lastTouched" | "owner" | "riskScore";
type SortDirection = "asc" | "desc";

export default function EventsOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("lastTouched");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredAndSortedEvents = useMemo(() => {
    let events = [...mockEvents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      events = events.filter(
        (e) =>
          e.id.toLowerCase().includes(query) ||
          e.title.toLowerCase().includes(query) ||
          e.owner.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      events = events.filter((e) => e.status === statusFilter);
    }

    events.sort((a, b) => {
      let aVal: string | number | Date = a[sortField];
      let bVal: string | number | Date = b[sortField];

      if (sortField === "initiatedAt" || sortField === "lastTouched") {
        aVal = new Date(aVal as Date).getTime();
        bVal = new Date(bVal as Date).getTime();
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }

      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return events;
  }, [searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const stats = useMemo(() => {
    const open = mockEvents.filter((e) => e.status === "open").length;
    const inProgress = mockEvents.filter((e) => e.status === "in_progress").length;
    const pendingReview = mockEvents.filter((e) => e.status === "pending_review").length;
    const overdue = mockEvents.filter((e) => e.dueDate && new Date(e.dueDate) < new Date() && e.status !== "closed").length;
    return { open, inProgress, pendingReview, overdue };
  }, []);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">Quality Events Overview</h1>
                  <p className="text-xs text-slate-500">All events at a glance</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Activity className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CircleDot className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Pending Review</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingReview}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold text-slate-900">All Quality Events</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EventStatus | "all")}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="id" label="Event ID" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="title" label="Title" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="status" label="Status" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Path
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="priority" label="Priority" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="initiatedAt" label="Initiated" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="lastTouched" label="Last Touched" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="owner" label="Owner" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <SortButton field="riskScore" label="Risk" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedEvents.map((event) => {
                      const StatusIcon = statusConfig[event.status].icon;
                      const isExpanded = expandedRow === event.id;
                      const isOverdue = event.dueDate && new Date(event.dueDate) < new Date() && event.status !== "closed";

                      return (
                        <>
                          <tr
                            key={event.id}
                            className={cn(
                              "hover:bg-slate-50/80 transition-colors cursor-pointer",
                              isExpanded && "bg-slate-50/80"
                            )}
                            onClick={() => setExpandedRow(isExpanded ? null : event.id)}
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono font-medium text-slate-900">{event.id}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                                <p className="text-xs text-slate-500">{event.phase}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", statusConfig[event.status].color)} />
                                <span className="text-sm text-slate-700">{statusConfig[event.status].label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={cn("text-xs", pathConfig[event.resolutionPath].color)}>
                                {pathConfig[event.resolutionPath].label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs", priorityConfig[event.priority].color)}>
                                {priorityConfig[event.priority].label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-700">
                                {format(event.initiatedAt, "MMM d, yyyy")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(event.initiatedAt, "HH:mm")}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-700">
                                {formatDistanceToNow(event.lastTouched, { addSuffix: true })}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(event.lastTouched, "MMM d, HH:mm")}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium">
                                  {event.owner.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <span className="text-sm text-slate-700">{event.owner}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div
                                className={cn(
                                  "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium",
                                  event.riskScore >= 15
                                    ? "bg-red-100 text-red-700"
                                    : event.riskScore >= 10
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                )}
                              >
                                {event.riskScore}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${event.id}-expanded`}>
                              <td colSpan={10} className="px-4 py-4 bg-slate-50/50">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                >
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-medium text-slate-500 uppercase">Description</h4>
                                    <p className="text-sm text-slate-700">{event.description}</p>
                                  </div>
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-medium text-slate-500 uppercase">Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-500">Department:</span>
                                        <span className="text-slate-700">{event.department}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Tag className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-500">Phase:</span>
                                        <span className="text-slate-700">{event.phase}</span>
                                      </div>
                                      {event.dueDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Calendar className="w-4 h-4 text-slate-400" />
                                          <span className="text-slate-500">Due:</span>
                                          <span className={cn("text-slate-700", isOverdue && "text-red-600 font-medium")}>
                                            {format(event.dueDate, "MMM d, yyyy")}
                                            {isOverdue && " (Overdue)"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-end justify-end">
                                    <Link href={`/events/${event.id}`}>
                                      <Button size="sm" className="gap-2">
                                        <Eye className="w-4 h-4" />
                                        View Full Details
                                      </Button>
                                    </Link>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredAndSortedEvents.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No events found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}