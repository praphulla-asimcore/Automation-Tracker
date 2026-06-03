"use client";

import { useState } from "react";
import { Module, TaskStatus } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  AlertTriangle,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Edit3,
  Check,
  X,
} from "lucide-react";

interface ModuleCardProps {
  module: Module;
  isExpanded: boolean;
  accentColor: string;
  onToggleExpand: () => void;
  onToggleSubTask: (taskId: string) => void;
  onUpdateModule: (updates: Partial<Module>) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; colors: string; dot: string }> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={14} />,
    colors: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock size={14} />,
    colors: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500 status-pulse",
  },
  blocked: {
    label: "Blocked",
    icon: <AlertCircle size={14} />,
    colors: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500 status-pulse",
  },
  not_started: {
    label: "Not Started",
    icon: <Circle size={14} />,
    colors: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-300",
  },
};

export default function ModuleCard({
  module,
  isExpanded,
  accentColor,
  onToggleExpand,
  onToggleSubTask,
  onUpdateModule,
}: ModuleCardProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(module.notes);

  const statusCfg = STATUS_CONFIG[module.status];
  const completedTasks = module.subTasks.filter((t) => t.completed).length;
  const totalTasks = module.subTasks.length;

  const handleStatusChange = (status: TaskStatus) => {
    const updates: Partial<Module> = { status };
    if (status === "completed") updates.progress = 100;
    else if (status === "not_started") updates.progress = 0;
    onUpdateModule(updates);
  };

  const saveNotes = () => {
    onUpdateModule({ notes: notesValue });
    setEditingNotes(false);
  };

  return (
    <div
      className={`glass-card rounded-2xl card-3d shadow-sm overflow-hidden border transition-all duration-300 ${
        module.status === "completed"
          ? "border-emerald-200 opacity-90"
          : module.status === "blocked"
          ? "border-red-200"
          : "border-white/80"
      }`}
    >
      {/* Left accent bar */}
      <div className="flex">
        <div
          className="w-1 flex-shrink-0 rounded-l-2xl transition-all duration-300"
          style={{
            background:
              module.status === "completed"
                ? "#16a34a"
                : module.status === "blocked"
                ? "#dc2626"
                : module.status === "in_progress"
                ? accentColor
                : "#e5e7eb",
          }}
        />

        <div className="flex-1 p-5">
          {/* Card header */}
          <div className="flex items-start gap-3">
            {/* Module number */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-inner mt-0.5"
              style={{ backgroundColor: accentColor + "20", color: accentColor }}
            >
              {module.id}
            </div>

            {/* Title & meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={onToggleExpand}
                  className="text-left flex items-center gap-2 group"
                >
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-gray-700 transition-colors">
                    {module.title}
                  </h3>
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <button
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${statusCfg.colors}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </button>
                    {/* Status dropdown */}
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 hidden group-hover:block min-w-[140px]">
                      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                            module.status === s ? "font-semibold" : ""
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  {module.dates}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User size={11} />
                  {module.owner}
                </span>
                {module.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100"
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {completedTasks}/{totalTasks} tasks
                  </span>
                  <span className="text-xs font-semibold" style={{ color: accentColor }}>
                    {module.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${module.progress}%`,
                      background:
                        module.status === "completed"
                          ? "linear-gradient(90deg, #16a34a, #22c55e)"
                          : module.status === "blocked"
                          ? "linear-gradient(90deg, #ef4444, #f97316)"
                          : `linear-gradient(90deg, ${accentColor}, #1565C0)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              {/* Dependencies */}
              {module.dependencies && module.dependencies.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-2">
                    <AlertTriangle size={12} />
                    Dependencies
                  </div>
                  <div className="space-y-1">
                    {module.dependencies.map((dep, i) => (
                      <div
                        key={i}
                        className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5"
                      >
                        {dep}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tasks */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Task Checklist
                </div>
                <div className="space-y-2">
                  {module.subTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={task.completed}
                        onChange={() => onToggleSubTask(task.id)}
                      />
                      <span
                        className={`text-sm transition-all ${
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-700 group-hover:text-gray-900"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.completed && (
                        <Check size={12} className="text-emerald-500 ml-auto flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <MessageSquare size={12} />
                    Progress Notes
                  </div>
                  {!editingNotes && (
                    <button
                      onClick={() => { setNotesValue(module.notes); setEditingNotes(true); }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 size={11} />
                      Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div>
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-white"
                      style={{ focusRingColor: accentColor } as React.CSSProperties}
                      placeholder="Add progress notes, blockers, or updates..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={saveNotes}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg transition-all"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-sm rounded-xl px-3 py-2.5 min-h-[40px] cursor-pointer hover:bg-gray-100 transition-colors ${
                      module.notes ? "text-gray-700 bg-gray-50" : "text-gray-400 bg-gray-50 italic"
                    }`}
                    onClick={() => { setNotesValue(module.notes); setEditingNotes(true); }}
                  >
                    {module.notes || "Click to add notes..."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
