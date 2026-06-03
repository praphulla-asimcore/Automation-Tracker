"use client";

import { useState } from "react";
import { AppSettings } from "@/lib/types";
import { X, Eye, EyeOff, Settings2, Mail, User, Shield, Users, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm]     = useState<AppSettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);

  const set = (key: keyof AppSettings, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
              style={{ background: "linear-gradient(135deg,#E91E8C,#9C27B0)" }}
            >
              <Settings2 size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500">Resend API & recipient configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">

          {/* Sender */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <User size={12} /> Sender
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your Name</label>
              <input
                type="text"
                value={form.senderName}
                onChange={(e) => set("senderName", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Asim"
              />
            </div>
          </section>

          {/* Resend API */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Mail size={12} /> Resend API
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3 flex items-start gap-2">
              <ExternalLink size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Get your API key at{" "}
                <span className="font-semibold">resend.com</span>. Free tier: 100 emails/day.
                Verify your domain (hexamatics.finance) to send from a custom address.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={form.resendApiKey}
                    onChange={(e) => set("resendApiKey", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                    placeholder="re_xxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
                  <input
                    type="text"
                    value={form.fromName}
                    onChange={(e) => set("fromName", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="Hexa Finance Tracker"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Email</label>
                  <input
                    type="email"
                    value={form.fromEmail}
                    onChange={(e) => set("fromEmail", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="noreply@hexamatics.finance"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Recipients */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Users size={12} /> Recipients
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Director Email (To)</label>
                <input
                  type="email"
                  value={form.directorEmail}
                  onChange={(e) => set("directorEmail", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="director@hexamatics.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  CC — Other Recipients
                  <span className="ml-1 font-normal text-gray-400">(comma-separated)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.ccEmails}
                  onChange={(e) => set("ccEmails", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  placeholder="ujjwal@hexamatics.com, ali@hexamatics.com"
                />
                {form.ccEmails && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {form.ccEmails.split(",").map((e) => e.trim()).filter(Boolean).map((email) => (
                      <span key={email} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                        {email}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Privacy note */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Shield size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Your API key is stored in your browser&apos;s localStorage only — never logged or sent to any server besides Resend.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#E91E8C,#9C27B0,#1565C0)" }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
