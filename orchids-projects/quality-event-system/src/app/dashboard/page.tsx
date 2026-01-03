"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Timer,
  Target,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const triageCategoryData = [
  { name: "CAPA", count: 24, fill: "#8b5cf6" },
  { name: "Correction Only", count: 18, fill: "#06b6d4" },
  { name: "Preventive Action", count: 12, fill: "#10b981" },
  { name: "No Action Required", count: 8, fill: "#6b7280" },
];

const ageDistributionData = [
  { range: "0-7 days", count: 15, avgDays: 4 },
  { range: "8-14 days", count: 22, avgDays: 11 },
  { range: "15-30 days", count: 18, avgDays: 22 },
  { range: "31-60 days", count: 8, avgDays: 45 },
  { range: "60+ days", count: 5, avgDays: 78 },
];

const cycleTimeData = [
  { month: "Jul", avgDays: 18, target: 14 },
  { month: "Aug", avgDays: 22, target: 14 },
  { month: "Sep", avgDays: 16, target: 14 },
  { month: "Oct", avgDays: 19, target: 14 },
  { month: "Nov", avgDays: 15, target: 14 },
  { month: "Dec", avgDays: 13, target: 14 },
];

const executionQualityData = [
  { category: "Root Cause Analysis", score: 78, issues: 12, total: 54 },
  { category: "Corrective Actions", score: 85, issues: 8, total: 53 },
  { category: "Verification", score: 72, issues: 15, total: 53 },
  { category: "Documentation", score: 91, issues: 5, total: 55 },
  { category: "Timeliness", score: 68, issues: 18, total: 56 },
];

const riskLevelData = [
  { name: "Unacceptable", count: 14, fill: "#ef4444" },
  { name: "Acceptable", count: 48, fill: "#22c55e" },
];

const monthlyTrendData = [
  { month: "Jul", new: 12, closed: 10, open: 28 },
  { month: "Aug", new: 18, closed: 14, open: 32 },
  { month: "Sep", new: 15, closed: 20, open: 27 },
  { month: "Oct", new: 22, closed: 18, open: 31 },
  { month: "Nov", new: 14, closed: 22, open: 23 },
  { month: "Dec", new: 16, closed: 19, open: 20 },
];

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#6b7280"];

export default function DashboardPage() {
  const stats = useMemo(() => {
    const totalRecords = triageCategoryData.reduce((acc, d) => acc + d.count, 0);
    const avgAge = Math.round(
      ageDistributionData.reduce((acc, d) => acc + d.count * d.avgDays, 0) /
        ageDistributionData.reduce((acc, d) => acc + d.count, 0)
    );
    const avgCycleTime = Math.round(
      cycleTimeData.reduce((acc, d) => acc + d.avgDays, 0) / cycleTimeData.length
    );
    const qualityScore = Math.round(
      executionQualityData.reduce((acc, d) => acc + d.score, 0) /
        executionQualityData.length
    );
    return { totalRecords, avgAge, avgCycleTime, qualityScore };
  }, []);

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">Quality Dashboard</h1>
                  <p className="text-xs text-slate-500">Real-time metrics & analytics</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Live Data
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Records"
            value={stats.totalRecords}
            subtitle="Active quality events"
            icon={Activity}
            color="violet"
          />
          <StatCard
            title="Avg Age"
            value={`${stats.avgAge} days`}
            subtitle="Time since initiation"
            icon={Clock}
            color="cyan"
            trend={{ value: -12, label: "vs last month" }}
          />
          <StatCard
            title="Avg Cycle Time"
            value={`${stats.avgCycleTime} days`}
            subtitle="Resolution duration"
            icon={Timer}
            color="emerald"
            trend={{ value: -8, label: "vs target" }}
          />
          <StatCard
            title="Quality Score"
            value={`${stats.qualityScore}%`}
            subtitle="Execution quality"
            icon={Target}
            color="amber"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-600" />
                  </div>
                  Records by Triage Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={triageCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="count"
                        label={({ name, count }) => `${name}: ${count}`}
                        labelLine={{ stroke: "#94a3b8" }}
                      >
                        {triageCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          color: "#1e293b",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {triageCategoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-xs text-slate-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-cyan-600" />
                  </div>
                  Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="range"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          color: "#1e293b",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        name="Records"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  Cycle Time Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cycleTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          color: "#1e293b",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgDays"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                        name="Avg Days"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                  </div>
                  Execution Quality Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executionQualityData.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{item.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {item.issues} issues / {item.total} records
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.score >= 85
                                ? "border-emerald-500/50 text-emerald-600 bg-emerald-50"
                                : item.score >= 70
                                ? "border-amber-500/50 text-amber-600 bg-amber-50"
                                : "border-rose-500/50 text-rose-600 bg-rose-50"
                            )}
                          >
                            {item.score}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.score >= 85
                              ? "bg-emerald-500"
                              : item.score >= 70
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          )}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  Risk Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskLevelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {riskLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          color: "#1e293b",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  {riskLevelData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-xs text-slate-600">
                        {item.name}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-violet-600" />
                  </div>
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          color: "#1e293b",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="new" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="New" />
                      <Bar dataKey="closed" fill="#10b981" radius={[4, 4, 0, 0]} name="Closed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: "violet" | "cyan" | "emerald" | "amber";
  trend?: { value: number; label: string };
}) {
  const colorClasses = {
    violet: "bg-violet-100 text-violet-600",
    cyan: "bg-cyan-100 text-cyan-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card className="bg-white/80 border-slate-200 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp
                  className={cn(
                    "w-3 h-3",
                    trend.value < 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.value < 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              colorClasses[color]
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}