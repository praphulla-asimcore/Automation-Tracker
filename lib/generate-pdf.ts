import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Module } from "./types";

const PINK   = [233, 30, 140]  as [number, number, number];
const PURPLE = [156, 39, 176]  as [number, number, number];
const BLUE   = [21,  101, 192] as [number, number, number];
const DARK   = [26,  26,  46]  as [number, number, number];
const LIGHT  = [248, 249, 252] as [number, number, number];

const PHASE_COLORS: Record<number, [number, number, number]> = {
  1: PINK, 2: PURPLE, 3: BLUE, 4: [13, 71, 161],
};
const PHASE_NAMES: Record<number, string> = {
  1: "Phase 1 — CSI Operations (3–9 Jun)",
  2: "Phase 2 — AP & Controls (10–17 Jun)",
  3: "Phase 3 — ARIA & Fund Flow (18–24 Jun)",
  4: "Phase 4 — Consolidation (25 Jun–7 Jul)",
};

function statusText(s: string) {
  switch (s) {
    case "completed":  return "Completed";
    case "in_progress": return "In Progress";
    case "blocked":    return "Blocked";
    default:           return "Not Started";
  }
}
function statusColor(s: string): [number, number, number] {
  switch (s) {
    case "completed":  return [22, 163, 74];
    case "in_progress": return [37, 99, 235];
    case "blocked":    return [220, 38, 38];
    default:           return [107, 114, 128];
  }
}

function lerpColor(a: number[], b: number[], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function drawGradientBar(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const col = t < 0.5 ? lerpColor(PINK, PURPLE, t * 2) : lerpColor(PURPLE, BLUE, (t - 0.5) * 2);
    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(x + (w / steps) * i, y, w / steps + 0.5, h, "F");
  }
}

function drawProgressBar(
  doc: jsPDF,
  x: number, y: number,
  totalW: number, h: number,
  pct: number,
  color: [number, number, number]
) {
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(x, y, totalW, h, h / 2, h / 2, "F");
  if (pct > 0) {
    const filled = (pct / 100) * totalW;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, Math.max(filled, h), h, h / 2, h / 2, "F");
  }
}

export function generateProgressPDF(
  modules: Module[],
  senderName: string,
  customNote: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  const ML = 15, MR = 15;
  const CW = PW - ML - MR;

  /* ── COVER HEADER ── */
  drawGradientBar(doc, 0, 0, PW, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("HEXA FINANCE", ML, 12);

  doc.setFontSize(18);
  doc.text("Automation Tracker — Progress Report", ML, 22);

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(now, ML, 30);
  doc.text(`Prepared by: ${senderName}`, ML, 36);

  // Overall % pill (top-right)
  const overall = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);
  doc.setFillColor(255, 255, 255, 0.18);
  doc.roundedRect(PW - MR - 28, 8, 28, 22, 4, 4, "F");
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${overall}%`, PW - MR - 14, 23, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Overall", PW - MR - 14, 28, { align: "center" });

  /* ── STATS ROW ── */
  const completed  = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked    = modules.filter((m) => m.status === "blocked").length;
  const notStarted = modules.length - completed - inProgress - blocked;

  let statY = 48;
  const stats = [
    { label: "Completed",   value: completed,  color: [22, 163, 74] as [number,number,number] },
    { label: "In Progress", value: inProgress, color: [37, 99, 235] as [number,number,number] },
    { label: "Blocked",     value: blocked,    color: [220, 38, 38] as [number,number,number] },
    { label: "Not Started", value: notStarted, color: [107,114,128] as [number,number,number] },
  ];
  const cardW = CW / 4 - 2;
  stats.forEach((s, i) => {
    const cx = ML + i * (cardW + 2.66);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(cx, statY, cardW, 16, 3, 3, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...s.color);
    doc.text(String(s.value), cx + cardW / 2, statY + 9, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(s.label.toUpperCase(), cx + cardW / 2, statY + 14, { align: "center" });
  });

  /* ── TARGET BANNER ── */
  const bannerY = statY + 20;
  drawGradientBar(doc, ML, bannerY, CW, 8);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("Target: 7 July 2026  ·  13 Modules  ·  4 Phases", ML + 2, bannerY + 5.5);

  // Overall progress bar
  const pbY = bannerY + 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Overall Progress", ML, pbY + 3.5);
  drawGradientBar(doc, ML + 38, pbY, CW - 50, 5);
  // white overlay to show empty portion
  doc.setFillColor(...LIGHT);
  doc.rect(ML + 38 + ((CW - 50) * overall) / 100, pbY, (CW - 50) * (1 - overall / 100), 5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`${overall}%`, PW - MR, pbY + 3.5, { align: "right" });

  /* ── CUSTOM NOTE ── */
  let curY = pbY + 14;
  if (customNote) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(ML, curY, CW, 12, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text("NOTE:", ML + 3, curY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 53, 15);
    const noteLines = doc.splitTextToSize(customNote, CW - 20);
    doc.text(noteLines[0], ML + 14, curY + 5);
    curY += 16;
  }

  /* ── MODULE TABLE ── */
  const grouped: Record<number, Module[]> = { 1: [], 2: [], 3: [], 4: [] };
  modules.forEach((m) => grouped[m.phase].push(m));

  for (const phase of [1, 2, 3, 4] as const) {
    const ms = grouped[phase];
    if (!ms.length) continue;

    // Phase heading
    autoTable(doc, {
      startY: curY,
      margin: { left: ML, right: MR },
      head: [[{ content: PHASE_NAMES[phase], colSpan: 4 }]],
      body: [],
      headStyles: {
        fillColor: PHASE_COLORS[phase],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      theme: "plain",
    });
    curY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // Module rows
    const tableBody = ms.map((m) => {
      const done = m.subTasks.filter((t) => t.completed).length;
      return [
        String(m.id),
        { content: m.title, styles: { fontStyle: "bold" as const } },
        `${m.progress}%\n${done}/${m.subTasks.length}`,
        statusText(m.status),
      ];
    });

    autoTable(doc, {
      startY: curY,
      margin: { left: ML, right: MR },
      head: [["#", "Module", "Progress", "Status"]],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" as const, textColor: [156, 163, 175] },
        1: { cellWidth: 100 },
        2: { cellWidth: 20, halign: "center" as const },
        3: { cellWidth: 32, halign: "center" as const },
      },
      headStyles: {
        fillColor: LIGHT,
        textColor: [107, 114, 128],
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
      alternateRowStyles: { fillColor: [252, 252, 253] },
      theme: "grid",
      // Draw progress bars and colour status badges inside cells
      didDrawCell(data) {
        if (data.section === "body") {
          const m = ms[data.row.index];
          // Progress bar (col 2)
          if (data.column.index === 2 && m) {
            const { x, y, width, height } = data.cell;
            const bY = y + height / 2 - 1.5;
            drawProgressBar(doc, x + 2, bY, width - 4, 3, m.progress, PHASE_COLORS[phase]);
          }
          // Status badge (col 3)
          if (data.column.index === 3 && m) {
            const sc = statusColor(m.status);
            doc.setTextColor(...sc);
          }
        }
      },
    });

    curY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // Add page if close to bottom
    if (curY > PH - 25 && phase < 4) {
      doc.addPage();
      curY = 15;
    }
  }

  /* ── FOOTER ── */
  const footerY = PH - 10;
  drawGradientBar(doc, 0, footerY - 1, PW, 12);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Hexa Finance Automation Tracker  ·  Generated ${new Date().toLocaleDateString("en-GB")}  ·  Confidential`,
    PW / 2, footerY + 5,
    { align: "center" }
  );

  const filename = `hexa-automation-progress-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
