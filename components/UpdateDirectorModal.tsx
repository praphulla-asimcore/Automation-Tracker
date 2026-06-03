"use client";

import { useState } from "react";
import { Module, AppSettings } from "@/lib/types";
import {
  X, Send, CheckCircle2, Clock, AlertCircle, Circle,
  AlertTriangle, Loader2, Download, FileText, Users,
} from "lucide-react";

interface Props {
  modules: Module[];
  settings: AppSettings;
  overallProgress: number;
  onClose: () => void;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":   return <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />;
    case "in_progress": return <Clock        size={13} className="text-blue-500    flex-shrink-0" />;
    case "blocked":     return <AlertCircle  size={13} className="text-red-500     flex-shrink-0" />;
    default:            return <Circle       size={13} className="text-gray-400    flex-shrink-0" />;
  }
}

export default function UpdateDirectorModal({ modules, settings, overallProgress, onClose }: Props) {
  const [customNote,    setCustomNote]    = useState("");
  const [directorEmail, setDirectorEmail] = useState(settings.directorEmail);
  const [ccEmails,      setCcEmails]      = useState(settings.ccEmails);
  const [tab,           setTab]           = useState<"summary" | "all">("summary");
  const [sending,       setSending]       = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sent,          setSent]          = useState(false);
  const [error,         setError]         = useState("");

  const completed  = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked    = modules.filter((m) => m.status === "blocked").length;

  const ccList = ccEmails.split(",").map((e) => e.trim()).filter(Boolean);

  /* ── PDF download ── */
  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    setError("");
    try {
      const { generateProgressPDF } = await import("@/lib/generate-pdf");
      generateProgressPDF(modules, settings.senderName || "Asim", customNote);
    } catch (err) {
      setError("PDF generation failed: " + (err as Error).message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ── Send via Resend ── */
  const handleSend = async () => {
    if (!directorEmail) { setError("Enter the director's email address."); return; }
    if (!settings.resendApiKey) { setError("Resend API key not set. Open Settings to configure it."); return; }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directorEmail,
          ccEmails,
          senderName: settings.senderName,
          customNote,
          modules,
          resendApiKey: settings.resendApiKey,
          fromEmail:    settings.fromEmail,
          fromName:     settings.fromName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  /* ── Success screen ── */
  if (sent) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Email Sent!</h3>
        <p className="text-sm text-gray-500 mb-2">
          Sent to <strong>{directorEmail}</strong>
          {ccList.length > 0 && <> + {ccList.length} CC</>}
        </p>
        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
          >
            {generatingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF too
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div
          className="px-6 py-5 text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#E91E8C 0%,#9C27B0 50%,#1565C0 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Update Director</h2>
              <p className="text-sm opacity-80 mt-0.5">Send email · Download PDF report</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Overall",     value: `${overallProgress}%`, color: "#9C27B0" },
              { label: "Completed",   value: completed,             color: "#16a34a" },
              { label: "In Progress", value: inProgress,            color: "#2563eb" },
              { label: "Blocked",     value: blocked,               color: "#dc2626" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-100">
            {(["summary", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  tab === t
                    ? "text-purple-700 border-b-2 border-purple-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "summary" ? "Summary" : "All Modules"}
              </button>
            ))}
          </div>

          {tab === "summary" ? (
            <div className="space-y-2">
              {modules
                .filter((m) => m.status !== "not_started" || m.notes)
                .map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <StatusIcon status={m.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{m.shortTitle}</div>
                      {m.notes && <div className="text-xs text-gray-500 truncate">{m.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${m.progress}%`, background: "linear-gradient(90deg,#E91E8C,#9C27B0)" }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 w-7 text-right">{m.progress}%</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {modules.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 w-5 font-mono flex-shrink-0">{m.id}</span>
                  <StatusIcon status={m.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{m.title}</div>
                  </div>
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.progress}%`, background: "linear-gradient(90deg,#E91E8C,#9C27B0)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-7 text-right flex-shrink-0">{m.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Blocked warning */}
          {blocked > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <strong>{blocked} module{blocked > 1 ? "s are" : " is"} blocked</strong> — highlighted in the report.
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Message to Director <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              placeholder="e.g. Phase 1 on track. Statutory module in review. No blockers at this time…"
            />
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Director Email (To)</label>
            <input
              type="email"
              value={directorEmail}
              onChange={(e) => setDirectorEmail(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="director@hexamatics.com"
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Users size={13} className="text-gray-400" />
              CC — Other Recipients
              <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="ujjwal@hexamatics.com, ali@hexamatics.com"
            />
            {ccList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ccList.map((email) => (
                  <span key={email} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 flex items-center gap-1">
                    <Users size={9} /> {email}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* PDF button */}
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-60"
            >
              {generatingPdf ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {generatingPdf ? "Generating…" : "Download PDF"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !directorEmail}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#E91E8C,#9C27B0,#1565C0)" }}
              >
                {sending ? (
                  <><Loader2 size={14} className="animate-spin" /> Sending…</>
                ) : (
                  <><Send size={14} /> Send Email</>
                )}
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            Via Resend · From: {settings.fromName || settings.senderName} &lt;{settings.fromEmail || "not configured"}&gt;
          </div>
        </div>
      </div>
    </div>
  );
}
