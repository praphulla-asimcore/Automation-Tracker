"use client";

import { Module } from "@/lib/types";
import { CheckCircle2, Clock, AlertCircle, Circle, TrendingUp } from "lucide-react";

interface StatsBarProps {
  modules: Module[];
}

export default function StatsBar({ modules }: StatsBarProps) {
  const completed = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked = modules.filter((m) => m.status === "blocked").length;
  const notStarted = modules.filter((m) => m.status === "not_started").length;
  const total = modules.length;
  const overallProgress = Math.round(modules.reduce((s, m) => s + m.progress, 0) / total);

  const totalSubTasks = modules.reduce((s, m) => s + m.subTasks.length, 0);
  const completedSubTasks = modules.reduce((s, m) => s + m.subTasks.filter((t) => t.completed).length, 0);

  const stats = [
    {
      label: "Completed",
      value: completed,
      total,
      icon: <CheckCircle2 size={20} />,
      color: "#16a34a",
      bg: "from-green-50 to-emerald-50",
      border: "border-green-100",
      iconBg: "bg-green-100",
    },
    {
      label: "In Progress",
      value: inProgress,
      total,
      icon: <Clock size={20} />,
      color: "#2563eb",
      bg: "from-blue-50 to-sky-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100",
    },
    {
      label: "Blocked",
      value: blocked,
      total,
      icon: <AlertCircle size={20} />,
      color: "#dc2626",
      bg: "from-red-50 to-rose-50",
      border: "border-red-100",
      iconBg: "bg-red-100",
    },
    {
      label: "Not Started",
      value: notStarted,
      total,
      icon: <Circle size={20} />,
      color: "#6b7280",
      bg: "from-gray-50 to-slate-50",
      border: "border-gray-100",
      iconBg: "bg-gray-100",
    },
    {
      label: "Tasks Done",
      value: completedSubTasks,
      total: totalSubTasks,
      icon: <TrendingUp size={20} />,
      color: "#9c27b0",
      bg: "from-purple-50 to-violet-50",
      border: "border-purple-100",
      iconBg: "bg-purple-100",
      suffix: `/${totalSubTasks}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-2xl p-4 card-3d shadow-sm`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`${stat.iconBg} p-2 rounded-xl`} style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <span className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}{stat.suffix || ""}
            </span>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {stat.label}
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((stat.value / stat.total) * 100)}%`,
                backgroundColor: stat.color,
              }}
            />
          </div>
        </div>
      ))}

      {/* Overall progress card — spans full width on mobile, 2 cols otherwise */}
      <div
        className="col-span-2 sm:col-span-3 lg:col-span-5 rounded-2xl p-5 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #E91E8C 0%, #9C27B0 50%, #1565C0 100%)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold opacity-80">Overall Automation Progress</div>
            <div className="text-xs opacity-60 mt-0.5">13 modules · 4 phases · Target: 7 July 2026</div>
          </div>
          <div className="text-4xl font-black">{overallProgress}%</div>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <div className="flex justify-between text-xs mt-2 opacity-70">
          <span>0%</span>
          <span>Phase 1 (9 Jun)</span>
          <span>Phase 2 (17 Jun)</span>
          <span>Phase 3 (24 Jun)</span>
          <span>100% (7 Jul)</span>
        </div>
      </div>
    </div>
  );
}
