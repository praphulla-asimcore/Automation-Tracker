import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Module } from "@/lib/types";

function statusLabel(status: string) {
  switch (status) {
    case "completed":  return "✅ Completed";
    case "in_progress": return "🔄 In Progress";
    case "blocked":    return "🔴 Blocked";
    default:           return "⬜ Not Started";
  }
}

function statusColors(status: string) {
  switch (status) {
    case "completed":  return { bg: "#dcfce7", color: "#15803d" };
    case "in_progress": return { bg: "#dbeafe", color: "#1d4ed8" };
    case "blocked":    return { bg: "#fee2e2", color: "#dc2626" };
    default:           return { bg: "#f3f4f6", color: "#6b7280" };
  }
}

function buildHtml(modules: Module[], senderName: string, customNote: string) {
  const total = modules.length;
  const completed  = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked    = modules.filter((m) => m.status === "blocked").length;
  const overall    = Math.round(modules.reduce((s, m) => s + m.progress, 0) / total);

  const phaseNames: Record<number, string> = {
    1: "Phase 1 — CSI Operations (3–9 Jun)",
    2: "Phase 2 — AP & Controls (10–17 Jun)",
    3: "Phase 3 — ARIA & Fund Flow (18–24 Jun)",
    4: "Phase 4 — Consolidation (25 Jun–7 Jul)",
  };
  const phaseAccents: Record<number, string> = {
    1: "#E91E8C", 2: "#9C27B0", 3: "#1565C0", 4: "#0D47A1",
  };

  const grouped: Record<number, Module[]> = { 1: [], 2: [], 3: [], 4: [] };
  modules.forEach((m) => grouped[m.phase].push(m));

  let rows = "";
  for (const phase of [1, 2, 3, 4]) {
    const ms = grouped[phase];
    if (!ms.length) continue;
    rows += `
      <tr>
        <td colspan="3" style="padding:14px 28px 6px;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${phaseAccents[phase]};">
            ${phaseNames[phase]}
          </span>
        </td>
      </tr>`;
    for (const m of ms) {
      const sc = statusColors(m.status);
      const done = m.subTasks.filter((t) => t.completed).length;
      rows += `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 28px;vertical-align:top;width:36px;font-size:13px;color:#9ca3af;font-family:monospace;">${m.id}</td>
          <td style="padding:12px 12px 12px 0;vertical-align:top;">
            <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:3px;">${m.title}</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">${m.dates} &nbsp;·&nbsp; ${m.owner}</div>
            <div style="background:#e5e7eb;border-radius:8px;height:5px;overflow:hidden;margin-bottom:3px;">
              <div style="width:${m.progress}%;height:100%;background:linear-gradient(90deg,#E91E8C,#9C27B0,#1565C0);border-radius:8px;"></div>
            </div>
            <div style="font-size:10px;color:#9ca3af;">${done}/${m.subTasks.length} tasks &nbsp;·&nbsp; ${m.progress}%</div>
            ${m.notes ? `<div style="margin-top:8px;font-size:11px;color:#92400e;background:#fffbeb;border-left:3px solid #f59e0b;padding:6px 10px;border-radius:0 6px 6px 0;">${m.notes}</div>` : ""}
          </td>
          <td style="padding:12px 28px 12px 0;vertical-align:top;white-space:nowrap;">
            <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;background:${sc.bg};color:${sc.color};">
              ${statusLabel(m.status)}
            </span>
          </td>
        </tr>`;
    }
  }

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="660" cellpadding="0" cellspacing="0" style="max-width:660px;width:100%;">

  <!-- Header gradient -->
  <tr><td style="background:linear-gradient(135deg,#E91E8C 0%,#9C27B0 50%,#1565C0 100%);border-radius:16px 16px 0 0;padding:32px 28px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.65);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">HEXA FINANCE</div>
        <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">Automation Progress Update</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);">${now}</div>
      </td>
      <td align="right" valign="top">
        <div style="background:rgba(255,255,255,.15);border-radius:12px;padding:12px 16px;text-align:center;min-width:72px;">
          <div style="font-size:34px;font-weight:800;color:#fff;line-height:1;">${overall}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,.8);margin-top:2px;">Overall</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Stats -->
  <tr><td style="background:#fff;padding:18px 28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="center" style="width:25%;">
        <div style="font-size:26px;font-weight:700;color:#15803d;">${completed}</div>
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Completed</div>
      </td>
      <td align="center" style="width:25%;border-left:1px solid #f0f0f0;">
        <div style="font-size:26px;font-weight:700;color:#1d4ed8;">${inProgress}</div>
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">In Progress</div>
      </td>
      <td align="center" style="width:25%;border-left:1px solid #f0f0f0;">
        <div style="font-size:26px;font-weight:700;color:#dc2626;">${blocked}</div>
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Blocked</div>
      </td>
      <td align="center" style="width:25%;border-left:1px solid #f0f0f0;">
        <div style="font-size:26px;font-weight:700;color:#6b7280;">${total - completed - inProgress - blocked}</div>
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Not Started</div>
      </td>
    </tr></table>
  </td></tr>

  ${customNote ? `
  <!-- Note -->
  <tr><td style="background:#fffbeb;border:1px solid #fde68a;border-top:0;padding:14px 28px;">
    <div style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:3px;">Note from ${senderName}</div>
    <div style="font-size:12px;color:#78350f;">${customNote}</div>
  </td></tr>` : ""}

  <!-- Module table -->
  <tr><td style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
        <td style="padding:8px 28px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;width:36px;">#</td>
        <td style="padding:8px 12px 8px 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Module</td>
        <td style="padding:8px 28px 8px 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;">Status</td>
      </tr>
      ${rows}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 0;text-align:center;">
    <div style="font-size:10px;color:#9ca3af;">Sent by ${senderName} via Hexa Finance Automation Tracker &nbsp;·&nbsp; Target: 7 July 2026</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function buildText(modules: Module[], senderName: string, customNote: string) {
  const overall = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);
  let out = `HEXA FINANCE AUTOMATION — PROGRESS UPDATE\nBy: ${senderName}  |  ${new Date().toLocaleDateString("en-GB")}\n\n`;
  out += `OVERALL: ${overall}%\n`;
  if (customNote) out += `NOTE: ${customNote}\n`;
  out += `\n--- MODULES ---\n\n`;
  modules.forEach((m) => {
    out += `[${m.id}] ${m.title}\n    ${statusLabel(m.status)} | ${m.progress}% | ${m.dates}\n`;
    if (m.notes) out += `    ${m.notes}\n`;
    out += "\n";
  });
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      directorEmail, ccEmails, senderName, customNote, modules,
      resendApiKey, fromEmail, fromName,
    } = body;

    if (!directorEmail || !modules?.length) {
      return NextResponse.json({ error: "Missing directorEmail or modules" }, { status: 400 });
    }

    const key = resendApiKey || process.env.RESEND_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Resend API key not configured. Add it in Settings." }, { status: 400 });
    }

    const resend = new Resend(key);
    const from = `${fromName || senderName || "Hexa Finance"} <${fromEmail || process.env.RESEND_FROM_EMAIL || "noreply@resend.dev"}>`;
    const ccList: string[] = ccEmails
      ? ccEmails.split(",").map((e: string) => e.trim()).filter(Boolean)
      : [];

    const overall = Math.round(modules.reduce((s: number, m: Module) => s + m.progress, 0) / modules.length);

    const { error } = await resend.emails.send({
      from,
      to: [directorEmail],
      cc: ccList,
      subject: `Hexa Finance Automation — ${overall}% Complete | ${new Date().toLocaleDateString("en-GB")}`,
      text: buildText(modules, senderName, customNote),
      html: buildHtml(modules, senderName, customNote),
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error;
    console.error("send-email error:", e);
    return NextResponse.json({ error: e.message || "Failed to send" }, { status: 500 });
  }
}
