"use client";

import { useState } from "react";
import { Module } from "@/lib/types";
import { AppSettings } from "@/app/page";
import { X, Send, CheckCircle2, Clock, AlertCircle, Circle, AlertTriangle, Loader2 } from "lucide-react";

interface UpdateDirectorModalProps {
  modules: Module[];
  settings: AppSettings;
  overallProgress: number;
  onClose: () => void;
}

export default function UpdateDirectorModal({
  modules,
  settings,
  overallProgress,
  onClose,
}: UpdateDirectorModalProps) {
  const [customNote, setCustomNote] = useState("");
  const [directorEmail, setDirectorEmail] = useState(settings.directorEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [previewTab, setPreviewTab] = useState<"summary" | "full">("summary");

  const completed = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked = modules.filter((m) => m.status === "blocked").length;

  const handleSend = async () => {
    if (!directorEmail) {
      setError("Please enter the director's email address.");
      return;
    }
    if (!settings.smtpUser || !settings.smtpPass) {
      setError("SMTP credentials not configured. Please go to Settings and configure email.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directorEmail,
          senderName: settings.senderName,
          customNote,
          modules,
          smtpConfig: {
            host: settings.smtpHost,
            port: parseInt(settings.smtpPort),
            secure: settings.smtpSecure,
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setSent(true);
    } catch (err) {
      setError((err as Error).message || "Failed to send. Check your SMTP settings.");
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "in_progress": return <Clock size={14} className="text-blue-500" />;
      case "blocked": return <AlertCircle size={14} className="text-red-500" />;
      default: return <Circle size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div
          className="px-6 py-5 text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E91E8C 0%, #9C27B0 50%, #1565C0 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Update Director</h2>
              <p className="text-sm opacity-80 mt-0.5">Send progress report via email</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Sent!</h3>
            <p className="text-gray-500 mb-6">
              Progress update sent to <strong>{directorEmail}</strong>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats preview */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Overall", value: `${overallProgress}%`, color: "#9C27B0" },
                  { label: "Completed", value: completed, color: "#16a34a" },
                  { label: "In Progress", value: inProgress, color: "#2563eb" },
                  { label: "Blocked", value: blocked, color: "#dc2626" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Preview tabs */}
              <div className="flex gap-2 border-b border-gray-100 pb-0">
                {(["summary", "full"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
                      previewTab === tab
                        ? "text-purple-700 border-b-2 border-purple-600 -mb-px"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "summary" ? "Summary Preview" : "All Modules"}
                  </button>
                ))}
              </div>

              {previewTab === "summary" ? (
                <div className="space-y-2">
                  {modules
                    .filter((m) => m.status !== "not_started" || m.notes)
                    .slice(0, 6)
                    .map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        {getStatusIcon(m.status)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{m.shortTitle}</div>
                          {m.notes && <div className="text-xs text-gray-500 truncate">{m.notes}</div>}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 flex-shrink-0">{m.progress}%</div>
                      </div>
                    ))}
                  {modules.filter((m) => m.status !== "not_started" || m.notes).length > 6 && (
                    <button
                      onClick={() => setPreviewTab("full")}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      + {modules.filter((m) => m.status !== "not_started" || m.notes).length - 6} more modules
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {modules.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0 font-mono">{m.id}</span>
                      {getStatusIcon(m.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{m.title}</div>
                      </div>
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.progress}%`,
                            background: "linear-gradient(90deg, #E91E8C, #9C27B0)",
                          }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-gray-500 w-8 text-right flex-shrink-0">
                        {m.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Blocked warning */}
              {blocked > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    <strong>{blocked} module{blocked > 1 ? "s are" : " is"} blocked</strong> — these will be highlighted in the email.
                  </p>
                </div>
              )}

              {/* Custom note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message to Director (optional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent resize-none"
                  placeholder="e.g. Phase 1 on track. BPJS calculation in review. No blockers at this time..."
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Director&apos;s Email
                </label>
                <input
                  type="email"
                  value={directorEmail}
                  onChange={(e) => setDirectorEmail(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                  placeholder="director@hexamatics.com"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
              <div className="text-xs text-gray-500">
                From: <strong>{settings.senderName}</strong> · via {settings.smtpHost || "SMTP"}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !directorEmail}
                  className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #E91E8C, #9C27B0, #1565C0)" }}
                >
                  {sending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
