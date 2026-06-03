"use client";

import { Settings2, RefreshCw } from "lucide-react";

interface HeaderProps {
  overallProgress: number;
  lastSaved: Date | null;
  onOpenSettings: () => void;
  onUpdateDirector: () => void;
}

export default function Header({ overallProgress, lastSaved, onOpenSettings }: HeaderProps) {
  const daysLeft = Math.ceil(
    (new Date("2026-07-07").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg"
              style={{ background: "linear-gradient(135deg, #E91E8C, #9C27B0, #1565C0)" }}
            >
              H
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">
                Hexa Finance
              </div>
              <div className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                Automation Tracker
              </div>
            </div>
          </div>

          {/* Center: Progress pill */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
              <div className="text-sm font-medium text-gray-500">Overall Progress</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${overallProgress}%`,
                    background: "linear-gradient(90deg, #E91E8C, #9C27B0, #1565C0)",
                  }}
                />
              </div>
              <div
                className="text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #E91E8C, #1565C0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {overallProgress}%
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <span className="text-xs font-semibold text-amber-700">🎯 {daysLeft} days to 7 Jul</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                <RefreshCw size={10} />
                <span>Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
