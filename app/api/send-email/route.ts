import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Module } from "@/lib/types";

function getStatusLabel(status: string) {
  switch (status) {
    case "completed": return "✅ Completed";
    case "in_progress": return "🔄 In Progress";
    case "blocked": return "🔴 Blocked";
    default: return "⬜ Not Started";
  }
}

function buildEmailHtml(modules: Module[], senderName: string, customNote: string) {
  const totalModules = modules.length;
  const completed = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked = modules.filter((m) => m.status === "blocked").length;
  const overallProgress = Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / totalModules);

  const phaseGroups: Record<number, Module[]> = { 1: [], 2: [], 3: [], 4: [] };
  modules.forEach((m) => phaseGroups[m.phase].push(m));

  const phaseNames: Record<number, string> = {
    1: "Phase 1 — CSI Operations (3–9 Jun)",
    2: "Phase 2 — AP & Controls (10–17 Jun)",
    3: "Phase 3 — ARIA & Fund Flow (18–24 Jun)",
    4: "Phase 4 — Consolidation (25 Jun–7 Jul)",
  };

  const phaseColors: Record<number, string> = {
    1: "#E91E8C",
    2: "#9C27B0",
    3: "#1565C0",
    4: "#0D47A1",
  };

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  let modulesHtml = "";
  for (const phase of [1, 2, 3, 4]) {
    const phaseModules = phaseGroups[phase];
    if (!phaseModules.length) continue;

    modulesHtml += `
      <tr><td colspan="4" style="padding: 16px 24px 8px; background: #f8f9fc;">
        <div style="font-size: 13px; font-weight: 700; color: ${phaseColors[phase]}; text-transform: uppercase; letter-spacing: 0.5px;">
          ${phaseNames[phase]}
        </div>
      </td></tr>
    `;

    for (const mod of phaseModules) {
      const completedTasks = mod.subTasks.filter((t) => t.completed).length;
      const totalTasks = mod.subTasks.length;
      const barWidth = mod.progress;

      modulesHtml += `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 14px 24px; vertical-align: top; width: 40px; font-size: 20px; color: #666;">
            ${mod.id}
          </td>
          <td style="padding: 14px 16px; vertical-align: top;">
            <div style="font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px;">${mod.title}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">${mod.dates} &nbsp;·&nbsp; Owner: ${mod.owner}</div>
            <div style="background: #e8e8e8; border-radius: 10px; height: 6px; margin-top: 6px; overflow: hidden;">
              <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, #E91E8C, #9C27B0, #1565C0); border-radius: 10px;"></div>
            </div>
            <div style="font-size: 11px; color: #888; margin-top: 4px;">${completedTasks}/${totalTasks} tasks · ${mod.progress}% complete</div>
            ${mod.notes ? `<div style="font-size: 12px; color: #555; margin-top: 8px; padding: 8px; background: #fffbf5; border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0;"><strong>Note:</strong> ${mod.notes}</div>` : ""}
          </td>
          <td style="padding: 14px 16px; vertical-align: top; white-space: nowrap;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
              background: ${mod.status === "completed" ? "#dcfce7" : mod.status === "in_progress" ? "#dbeafe" : mod.status === "blocked" ? "#fee2e2" : "#f3f4f6"};
              color: ${mod.status === "completed" ? "#15803d" : mod.status === "in_progress" ? "#1d4ed8" : mod.status === "blocked" ? "#dc2626" : "#6b7280"};">
              ${getStatusLabel(mod.status)}
            </span>
          </td>
        </tr>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f5f7; padding: 32px 0;">
        <tr><td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="max-width: 680px; width: 100%;">

            <!-- Header -->
            <tr><td style="background: linear-gradient(135deg, #E91E8C 0%, #9C27B0 50%, #1565C0 100%); border-radius: 16px 16px 0 0; padding: 32px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">HEXA FINANCE</div>
                    <div style="font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px;">Automation Progress Update</div>
                    <div style="font-size: 13px; color: rgba(255,255,255,0.8);">${now}</div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 16px; text-align: center; min-width: 80px;">
                      <div style="font-size: 36px; font-weight: 800; color: white; line-height: 1;">${overallProgress}%</div>
                      <div style="font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px;">Overall</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Stats row -->
            <tr><td style="background: white; padding: 20px 32px; border-left: 1px solid #e8e8e8; border-right: 1px solid #e8e8e8;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width: 25%;">
                    <div style="font-size: 28px; font-weight: 700; color: #15803d;">${completed}</div>
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Completed</div>
                  </td>
                  <td align="center" style="width: 25%; border-left: 1px solid #f0f0f0;">
                    <div style="font-size: 28px; font-weight: 700; color: #1d4ed8;">${inProgress}</div>
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">In Progress</div>
                  </td>
                  <td align="center" style="width: 25%; border-left: 1px solid #f0f0f0;">
                    <div style="font-size: 28px; font-weight: 700; color: #dc2626;">${blocked}</div>
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Blocked</div>
                  </td>
                  <td align="center" style="width: 25%; border-left: 1px solid #f0f0f0;">
                    <div style="font-size: 28px; font-weight: 700; color: #6b7280;">${totalModules - completed - inProgress - blocked}</div>
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Not Started</div>
                  </td>
                </tr>
              </table>
            </td></tr>

            ${customNote ? `
            <!-- Custom note -->
            <tr><td style="background: #fffbf0; border: 1px solid #fde68a; border-top: 0; padding: 16px 32px;">
              <div style="font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 4px;">Note from ${senderName}</div>
              <div style="font-size: 13px; color: #78350f;">${customNote}</div>
            </td></tr>` : ""}

            <!-- Module table -->
            <tr><td style="background: white; border: 1px solid #e8e8e8; border-top: 0; border-radius: 0 0 16px 16px; overflow: hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="background: #f8f9fc; border-bottom: 2px solid #e8e8e8;">
                  <td style="padding: 10px 24px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; width: 40px;">#</td>
                  <td style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Module</td>
                  <td style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Status</td>
                </tr>
                ${modulesHtml}
              </table>
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding: 20px 0; text-align: center;">
              <div style="font-size: 11px; color: #9ca3af;">Sent by ${senderName} via Hexa Finance Automation Tracker &nbsp;·&nbsp; Target completion: 7 July 2026</div>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function buildEmailText(modules: Module[], senderName: string, customNote: string) {
  const overallProgress = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);
  const completed = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;

  let text = `HEXA FINANCE AUTOMATION — PROGRESS UPDATE\n`;
  text += `Sent by: ${senderName}\n`;
  text += `Date: ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
  text += `OVERALL PROGRESS: ${overallProgress}%\n`;
  text += `Completed: ${completed} | In Progress: ${inProgress} | Remaining: ${modules.length - completed - inProgress}\n\n`;
  if (customNote) text += `NOTE: ${customNote}\n\n`;
  text += `--- MODULE STATUS ---\n\n`;
  modules.forEach((m) => {
    text += `[${m.id}] ${m.title}\n`;
    text += `    Status: ${getStatusLabel(m.status)} | Progress: ${m.progress}%\n`;
    text += `    Dates: ${m.dates} | Owner: ${m.owner}\n`;
    if (m.notes) text += `    Note: ${m.notes}\n`;
    text += `\n`;
  });
  text += `Target completion: 7 July 2026\n`;
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { directorEmail, senderName, customNote, modules, smtpConfig } = body;

    if (!directorEmail || !modules) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transportConfig = smtpConfig?.host
      ? {
          host: smtpConfig.host,
          port: smtpConfig.port || 587,
          secure: smtpConfig.secure || false,
          auth: { user: smtpConfig.user, pass: smtpConfig.pass },
        }
      : {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
          },
        };

    const transporter = nodemailer.createTransport(transportConfig);

    const overallProgress = Math.round(
      modules.reduce((s: number, m: Module) => s + m.progress, 0) / modules.length
    );

    await transporter.sendMail({
      from: `"${senderName} — Hexa Finance" <${transportConfig.auth?.user || smtpConfig?.user}>`,
      to: directorEmail,
      subject: `Hexa Finance Automation — ${overallProgress}% Complete | Progress Update ${new Date().toLocaleDateString("en-GB")}`,
      text: buildEmailText(modules, senderName, customNote),
      html: buildEmailHtml(modules, senderName, customNote),
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    const error = err as Error;
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
