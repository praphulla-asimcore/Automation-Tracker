"use client";

import { useState } from "react";
import { AppSettings } from "@/app/page";
import { X, Eye, EyeOff, Settings2, Mail, Server, User, Shield } from "lucide-react";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [showPass, setShowPass] = useState(false);

  const update = (key: keyof AppSettings, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
              style={{ background: "linear-gradient(135deg, #E91E8C, #9C27B0)" }}
            >
              <Settings2 size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500">Email & SMTP configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Sender info */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <User size={12} />
              Sender Info
            </div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={form.senderName}
                  onChange={(e) => update("senderName", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. Asim"
                />
              </div>
            </div>
          </section>

          {/* Director email */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Mail size={12} />
              Director Email
            </div>
            <input
              type="email"
              value={form.directorEmail}
              onChange={(e) => update("directorEmail", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="director@hexamatics.com"
            />
          </section>

          {/* SMTP config */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Server size={12} />
              SMTP Configuration
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-3">
              <p className="text-xs text-blue-700">
                <strong>Gmail users:</strong> Use smtp.gmail.com, port 587. Create an{" "}
                <strong>App Password</strong> at myaccount.google.com/apppasswords (requires 2FA).
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={form.smtpHost}
                    onChange={(e) => update("smtpHost", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                  <input
                    type="text"
                    value={form.smtpPort}
                    onChange={(e) => update("smtpPort", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (from address)</label>
                <input
                  type="email"
                  value={form.smtpUser}
                  onChange={(e) => update("smtpUser", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="your@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password / App Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.smtpPass}
                    onChange={(e) => update("smtpPass", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="App password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={form.smtpSecure}
                  onChange={(e) => update("smtpSecure", e.target.checked)}
                />
                <span className="text-sm text-gray-700">Use SSL (port 465)</span>
              </label>
            </div>
          </section>

          {/* Security note */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Shield size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Credentials are stored locally in your browser only and never sent to any server other than your configured SMTP provider.
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
            style={{ background: "linear-gradient(135deg, #E91E8C, #9C27B0, #1565C0)" }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
