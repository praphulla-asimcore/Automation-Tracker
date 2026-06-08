"use client";

import { useState, useEffect, useCallback } from "react";
import { Module, TaskStatus, AppSettings } from "@/lib/types";
import { INITIAL_MODULES, PHASE_LABELS, PHASE_DATES, PHASE_COLORS } from "@/lib/data";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import PhaseSection from "@/components/PhaseSection";
import UpdateDirectorModal from "@/components/UpdateDirectorModal";
import SettingsModal from "@/components/SettingsModal";

// Bumped to v2: the module/subtask structure was realigned to the Malaysia-first
// plan, so older saved copies (with Indonesia/Myanmar statutory items) must not
// override the new seed data.
const STORAGE_KEY = "hexa-automation-tracker-v2";
const LEGACY_STORAGE_KEYS = ["hexa-automation-tracker-v1"];
const SETTINGS_KEY = "hexa-automation-settings-v2";

const DEFAULT_SETTINGS: AppSettings = {
  resendApiKey: "",
  fromEmail: "noreply@hexamatics.finance",
  fromName: "Hexa Finance Tracker",
  directorEmail: "",
  ccEmails: "",
  senderName: "Asim",
};

export default function Home() {
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activePhase, setActivePhase] = useState<number | "all">("all");
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([1, 2]));
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setModules(JSON.parse(saved));
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {}
  }, []);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
      setLastSaved(new Date());
    }, 500);
    return () => clearTimeout(timer);
  }, [modules]);

  const updateModule = useCallback((id: number, updates: Partial<Module>) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        // Auto-calculate progress from subtasks if not explicitly set
        if (updates.subTasks) {
          const done = updates.subTasks.filter((t) => t.completed).length;
          const total = updates.subTasks.length;
          updated.progress = total > 0 ? Math.round((done / total) * 100) : 0;
          // Auto-update status
          if (updated.progress === 100) updated.status = "completed";
          else if (updated.progress > 0 && updated.status === "not_started") updated.status = "in_progress";
          else if (updated.progress === 0 && updated.status !== "blocked") updated.status = "not_started";
        }
        return updated;
      })
    );
  }, []);

  const toggleSubTask = useCallback((moduleId: number, taskId: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const newSubTasks = m.subTasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const done = newSubTasks.filter((t) => t.completed).length;
        const total = newSubTasks.length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        let status: TaskStatus = m.status;
        if (progress === 100) status = "completed";
        else if (progress > 0 && status === "not_started") status = "in_progress";
        else if (progress === 0 && status !== "blocked") status = "not_started";
        return { ...m, subTasks: newSubTasks, progress, status };
      })
    );
  }, []);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const saveSettings = (s: AppSettings) => {
    setSettings(s);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    setShowSettings(false);
  };

  const filteredModules =
    activePhase === "all" ? modules : modules.filter((m) => m.phase === activePhase);

  const phases = [1, 2, 3, 4] as const;
  const phaseModules = (phase: number) => filteredModules.filter((m) => m.phase === phase);

  const overallProgress = Math.round(
    modules.reduce((sum, m) => sum + m.progress, 0) / modules.length
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header
        overallProgress={overallProgress}
        lastSaved={lastSaved}
        onOpenSettings={() => setShowSettings(true)}
        onUpdateDirector={() => setShowDirectorModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsBar modules={modules} />

        {/* Phase filter tabs */}
        <div className="flex items-center gap-2 mt-8 mb-6 flex-wrap">
          <button
            onClick={() => setActivePhase("all")}
            className={`px-4 py-2 rounded-full text-sm font-600 transition-all duration-200 ${
              activePhase === "all"
                ? "text-white shadow-lg"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}
            style={activePhase === "all" ? { background: "linear-gradient(135deg, #E91E8C, #9C27B0, #1565C0)" } : {}}
          >
            All Phases
          </button>
          {phases.map((phase) => {
            const colors = PHASE_COLORS[phase];
            const isActive = activePhase === phase;
            return (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive ? "text-white shadow-lg" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                }`}
                style={isActive ? { backgroundColor: colors.accent } : {}}
              >
                <span className="hidden sm:inline">{PHASE_LABELS[phase]}</span>
                <span className="sm:hidden">Phase {phase}</span>
              </button>
            );
          })}
        </div>

        {/* Module sections by phase */}
        {phases.map((phase) => {
          const pModules = phaseModules(phase);
          if (!pModules.length) return null;
          return (
            <PhaseSection
              key={phase}
              phase={phase}
              label={PHASE_LABELS[phase]}
              dateRange={PHASE_DATES[phase]}
              modules={pModules}
              expandedModules={expandedModules}
              onToggleExpand={toggleExpanded}
              onToggleSubTask={toggleSubTask}
              onUpdateModule={updateModule}
            />
          );
        })}
      </main>

      {/* Floating Update Director Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setShowDirectorModal(true)}
          className="group flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #E91E8C 0%, #9C27B0 50%, #1565C0 100%)" }}
        >
          <span className="text-xl">📧</span>
          <span>Update Director</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
            {overallProgress}%
          </span>
        </button>
      </div>

      {/* Modals */}
      {showDirectorModal && (
        <UpdateDirectorModal
          modules={modules}
          settings={settings}
          onClose={() => setShowDirectorModal(false)}
          overallProgress={overallProgress}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
