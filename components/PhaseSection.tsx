"use client";

import { Module } from "@/lib/types";
import { PHASE_COLORS } from "@/lib/data";
import ModuleCard from "./ModuleCard";

interface PhaseSectionProps {
  phase: number;
  label: string;
  dateRange: string;
  modules: Module[];
  expandedModules: Set<number>;
  onToggleExpand: (id: number) => void;
  onToggleSubTask: (moduleId: number, taskId: string) => void;
  onUpdateModule: (id: number, updates: Partial<Module>) => void;
}

export default function PhaseSection({
  phase,
  label,
  dateRange,
  modules,
  expandedModules,
  onToggleExpand,
  onToggleSubTask,
  onUpdateModule,
}: PhaseSectionProps) {
  const colors = PHASE_COLORS[phase];
  const completed = modules.filter((m) => m.status === "completed").length;
  const phaseProgress = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);

  return (
    <div className="mb-10">
      {/* Phase header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: colors.accent }}
          >
            {phase}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{label}</h2>
            <p className="text-xs text-gray-500">{dateRange}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${phaseProgress}%`, backgroundColor: colors.accent }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-600">{phaseProgress}%</span>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
            {completed}/{modules.length} done
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, ${colors.accent}40, transparent)` }} />

      {/* Module cards */}
      <div className="grid gap-4">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isExpanded={expandedModules.has(module.id)}
            onToggleExpand={() => onToggleExpand(module.id)}
            onToggleSubTask={(taskId) => onToggleSubTask(module.id, taskId)}
            onUpdateModule={(updates) => onUpdateModule(module.id, updates)}
            accentColor={colors.accent}
          />
        ))}
      </div>
    </div>
  );
}
