/**
 * generateProgressPDF — fully manual jsPDF layout, no autoTable.
 * Every rect, text and bar is drawn at an explicit coordinate so nothing
 * can overlap or mis-align regardless of content length.
 */
import jsPDF from "jspdf";
import { Module } from "./types";

// ─── palette ────────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C: Record<string, RGB> = {
  navy:    [15,  23,  42],
  white:   [255, 255, 255],
  bg:      [248, 249, 252],
  lgray:   [229, 231, 235],
  mgray:   [156, 163, 175],
  dgray:   [107, 114, 128],
  pink:    [233,  30, 140],
  purple:  [156,  39, 176],
  blue:    [ 21, 101, 192],
  indigo:  [ 13,  71, 161],
  green:   [ 22, 163,  74],
  red:     [220,  38,  38],
  amber:   [146,  64,  14],
  amberBg: [255, 251, 235],
};

const PHASE_COLOR: Record<number, RGB> = {
  1: C.pink, 2: C.purple, 3: C.blue, 4: C.indigo,
};
const PHASE_NAME: Record<number, string> = {
  1: "Phase 1 — CSI Operations",
  2: "Phase 2 — AP & Controls",
  3: "Phase 3 — ARIA & Fund Flow",
  4: "Phase 4 — Consolidation",
};
const PHASE_DATE: Record<number, string> = {
  1: "3–10 Jun 2026",
  2: "11–17 Jun 2026",
  3: "18–24 Jun 2026",
  4: "25 Jun–7 Jul 2026",
};

function statusText(s: string) {
  if (s === "completed")  return "Completed";
  if (s === "in_progress") return "In Progress";
  if (s === "blocked")    return "Blocked";
  return "Not Started";
}
function statusFg(s: string): RGB {
  if (s === "completed")  return C.green;
  if (s === "in_progress") return C.blue;
  if (s === "blocked")    return C.red;
  return C.dgray;
}
function statusBg(s: string): RGB {
  if (s === "completed")  return [220, 252, 231];
  if (s === "in_progress") return [219, 234, 254];
  if (s === "blocked")    return [254, 226, 226];
  return [243, 244, 246];
}

// ─── helpers ────────────────────────────────────────────────────────────────
function fill(doc: jsPDF, c: RGB)  { doc.setFillColor  (c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: RGB){ doc.setDrawColor  (c[0], c[1], c[2]); }
function color(doc: jsPDF, c: RGB) { doc.setTextColor  (c[0], c[1], c[2]); }
function bold  (doc: jsPDF, sz: number) { doc.setFont("helvetica","bold");   doc.setFontSize(sz); }
function normal(doc: jsPDF, sz: number) { doc.setFont("helvetica","normal"); doc.setFontSize(sz); }

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F"|"S"|"FD" = "F") {
  doc.roundedRect(x, y, w, h, r, r, style);
}

function progressBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number, fg: RGB) {
  fill(doc, C.lgray);
  roundRect(doc, x, y, w, h, h / 2);
  if (pct > 0) {
    fill(doc, fg);
    roundRect(doc, x, y, Math.max((pct / 100) * w, h), h, h / 2);
  }
}

// ─── page constants ──────────────────────────────────────────────────────────
const PW = 210, PH = 297;
const ML = 14, MR = 14;         // left / right margin
const CW = PW - ML - MR;        // 182 mm content width

// Column layout (all x values are absolute, from left edge of page)
// | ID(9) | gap(1) | Title(97) | gap(2) | Bar(44) | gap(2) | Status(27) |
// 9+1+97+2+44+2+27 = 182 = CW ✓
const COL = {
  id:     { x: ML,          w: 9  },
  title:  { x: ML + 10,     w: 97 },
  bar:    { x: ML + 110,    w: 44 },
  status: { x: ML + 156,    w: 26 },
};

const FOOTER_H = 11;
const SAFE_BOTTOM = PH - FOOTER_H - 4; // last safe y before footer

// ─── footer ─────────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  fill(doc, C.navy);
  doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, "F");
  // pink left strip
  fill(doc, C.pink);
  doc.rect(0, PH - FOOTER_H, 3, FOOTER_H, "F");
  normal(doc, 6.5);
  color(doc, [160, 170, 200]);
  doc.text(
    `Hexa Finance Automation Tracker  ·  Generated ${new Date().toLocaleDateString("en-GB")}  ·  Commercial in Confidence`,
    PW / 2, PH - 3.5,
    { align: "center" }
  );
  doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, PH - 3.5, { align: "right" });
}

// ─── column-header row ──────────────────────────────────────────────────────
function drawColHeaders(doc: jsPDF, y: number) {
  fill(doc, C.navy);
  doc.rect(ML, y, CW, 7, "F");
  bold(doc, 6.5);
  color(doc, [160, 170, 200]);
  doc.text("#",        COL.id.x     + COL.id.w / 2,       y + 4.7, { align: "center" });
  doc.text("MODULE",   COL.title.x  + 2,                   y + 4.7);
  doc.text("PROGRESS", COL.bar.x    + COL.bar.w / 2,       y + 4.7, { align: "center" });
  doc.text("STATUS",   COL.status.x + COL.status.w / 2,    y + 4.7, { align: "center" });
  return y + 7;
}

// ─── main export ─────────────────────────────────────────────────────────────
export function generateProgressPDF(modules: Module[], senderName: string, customNote: string) {
  // pre-calculate how many pages we'll need (rough pass)
  // We'll do a two-pass approach: first pass collects rows, second draws
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const overall    = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);
  const completed  = modules.filter((m) => m.status === "completed").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked    = modules.filter((m) => m.status === "blocked").length;
  const notStarted = modules.length - completed - inProgress - blocked;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── PAGE 1: HEADER ────────────────────────────────────────────────────────
  // Dark header block
  fill(doc, C.navy);
  doc.rect(0, 0, PW, 42, "F");
  // Pink left accent
  fill(doc, C.pink);
  doc.rect(0, 0, 3, 42, "F");

  // Top label
  normal(doc, 7);
  color(doc, [120, 130, 170]);
  doc.text("HEXA FINANCE  ·  AUTOMATION TRACKER  ·  CONFIDENTIAL", ML + 4, 10);

  // Title
  bold(doc, 17);
  color(doc, C.white);
  doc.text("Progress Report", ML + 4, 21);

  // Date & sender
  normal(doc, 8);
  color(doc, [160, 170, 210]);
  doc.text(dateStr, ML + 4, 29);
  doc.text(`Prepared by: ${senderName}  ·  Target: 7 July 2026`, ML + 4, 35.5);

  // Overall % badge (top-right)
  fill(doc, C.pink);
  roundRect(doc, PW - MR - 26, 6, 26, 24, 4);
  bold(doc, 17);
  color(doc, C.white);
  doc.text(`${overall}%`, PW - MR - 13, 20, { align: "center" });
  normal(doc, 7);
  color(doc, [220, 200, 230]);
  doc.text("OVERALL", PW - MR - 13, 26.5, { align: "center" });

  // ── STATS CARDS ──────────────────────────────────────────────────────────
  let y = 47;
  const statsData = [
    { label: "Completed",   value: completed,      fg: C.green  },
    { label: "In Progress", value: inProgress,     fg: C.blue   },
    { label: "Blocked",     value: blocked,        fg: C.red    },
    { label: "Not Started", value: notStarted,     fg: C.dgray  },
    { label: "Total",       value: modules.length, fg: C.purple },
  ];
  const cW = (CW - 4) / 5;  // card width
  statsData.forEach((s, i) => {
    const cx = ML + i * (cW + 1);
    fill(doc, C.bg);
    roundRect(doc, cx, y, cW, 17, 3);
    // value
    bold(doc, 13);
    color(doc, s.fg);
    doc.text(String(s.value), cx + cW / 2, y + 9.5, { align: "center" });
    // label
    normal(doc, 6.5);
    color(doc, C.dgray);
    doc.text(s.label.toUpperCase(), cx + cW / 2, y + 14.5, { align: "center" });
  });

  // ── OVERALL PROGRESS BAR ─────────────────────────────────────────────────
  y += 22;
  bold(doc, 7.5);
  color(doc, C.dgray);
  doc.text("OVERALL PROGRESS", ML, y + 4);
  // bar
  const pbX = ML + 40, pbW = CW - 52, pbH = 4.5;
  progressBar(doc, pbX, y, pbW, pbH, overall, C.pink);
  // % label
  bold(doc, 8.5);
  color(doc, C.pink);
  doc.text(`${overall}%`, PW - MR, y + pbH - 0.5, { align: "right" });
  // target label
  normal(doc, 6.5);
  color(doc, C.mgray);
  doc.text("0%", pbX, y + pbH + 4);
  doc.text("100% — 7 Jul 2026", pbX + pbW, y + pbH + 4, { align: "right" });

  // ── OPTIONAL NOTE ────────────────────────────────────────────────────────
  y += 16;
  if (customNote) {
    const noteLines = doc.splitTextToSize(customNote, CW - 22);
    const noteH = 7 + noteLines.length * 4;
    fill(doc, C.amberBg);
    roundRect(doc, ML, y, CW, noteH, 2.5);
    stroke(doc, [253, 211, 100]);
    doc.setLineWidth(0.3);
    roundRect(doc, ML, y, CW, noteH, 2.5, "S");
    // left bar
    fill(doc, [245, 158, 11]);
    roundRect(doc, ML, y, 3, noteH, 1.5);
    bold(doc, 7);
    color(doc, C.amber);
    doc.text("NOTE", ML + 6, y + 5.5);
    normal(doc, 7.5);
    color(doc, [120, 53, 15]);
    doc.text(noteLines, ML + 6, y + 10);
    y += noteH + 5;
  }

  // ── COLUMN HEADERS ───────────────────────────────────────────────────────
  y += 3;
  y = drawColHeaders(doc, y);

  // ── MODULE ROWS ──────────────────────────────────────────────────────────
  const grouped: Record<number, Module[]> = { 1: [], 2: [], 3: [], 4: [] };
  modules.forEach((m) => grouped[m.phase].push(m));

  let pageCount = 1;
  let rowAlt = false; // alternating row shading

  for (const phase of [1, 2, 3, 4] as const) {
    const ms = grouped[phase];
    if (!ms.length) continue;

    const pc = PHASE_COLOR[phase];
    const phaseDone = ms.filter((m) => m.status === "completed").length;

    // Check space for phase header + at least 1 row (phase header ~8 + row ~16 = 24)
    if (y + 24 > SAFE_BOTTOM) {
      drawFooter(doc, pageCount, pageCount); // placeholder total, update later
      doc.addPage();
      pageCount++;
      y = 14;
      rowAlt = false;
      y = drawColHeaders(doc, y);
    }

    // Phase header row
    fill(doc, pc);
    doc.rect(ML, y, CW, 8, "F");
    bold(doc, 7.5);
    color(doc, C.white);
    doc.text(
      `${PHASE_NAME[phase]}   ·   ${PHASE_DATE[phase]}`,
      ML + 4, y + 5.5
    );
    normal(doc, 7);
    doc.text(`${phaseDone}/${ms.length} complete`, PW - MR - 1, y + 5.5, { align: "right" });
    y += 8;

    // Module rows
    for (const m of ms) {
      // Calculate row height based on title length
      const titleLines = doc.splitTextToSize(m.title, COL.title.w - 2);
      const metaText   = `${m.dates}  ·  ${m.owner}`;
      const hasNote    = !!m.notes;
      // base: 4 top pad + title lines + 4 meta + (3.5 if note) + 4 bottom pad
      const rowH = Math.max(
        16,
        4 + titleLines.length * 4.5 + 4.5 + (hasNote ? 4 : 0) + 4
      );

      // Page break if needed
      if (y + rowH > SAFE_BOTTOM) {
        drawFooter(doc, pageCount, pageCount);
        doc.addPage();
        pageCount++;
        y = 14;
        rowAlt = false;
        y = drawColHeaders(doc, y);
        // Re-draw phase header for context
        fill(doc, pc);
        doc.rect(ML, y, CW, 7, "F");
        bold(doc, 7);
        color(doc, C.white);
        doc.text(`${PHASE_NAME[phase]} (continued)`, ML + 4, y + 5);
        y += 7;
      }

      // Row background
      if (rowAlt) {
        fill(doc, C.bg);
        doc.rect(ML, y, CW, rowH, "F");
      }
      rowAlt = !rowAlt;

      // Bottom border
      stroke(doc, C.lgray);
      doc.setLineWidth(0.2);
      doc.line(ML, y + rowH, ML + CW, y + rowH);

      // Phase-colour left accent strip (2 mm wide)
      fill(doc, pc);
      doc.rect(ML, y, 2, rowH, "F");

      // ── ID ──────────────────────────────────────────────────────────────
      bold(doc, 9);
      color(doc, pc);
      doc.text(
        m.id < 10 ? `0${m.id}` : String(m.id),
        COL.id.x + COL.id.w - 1, y + rowH / 2 + 1.5,
        { align: "right" }
      );

      // ── TITLE + META ────────────────────────────────────────────────────
      const titleY = y + 5;
      bold(doc, 8);
      color(doc, C.navy);
      doc.text(titleLines, COL.title.x, titleY);

      const metaY = titleY + titleLines.length * 4.5;
      normal(doc, 6.5);
      color(doc, C.mgray);
      doc.text(metaText, COL.title.x, metaY);

      if (hasNote && m.notes) {
        const noteY = metaY + 4;
        normal(doc, 6);
        color(doc, C.amber);
        const nLines = doc.splitTextToSize(`↳ ${m.notes}`, COL.title.w - 2);
        doc.text(nLines[0], COL.title.x, noteY);
      }

      // ── PROGRESS BAR ────────────────────────────────────────────────────
      const done    = m.subTasks.filter((t) => t.completed).length;
      const total   = m.subTasks.length;
      const barW    = COL.bar.w - 14;  // 30mm for bar, 14mm for % label
      const barH    = 3.5;
      const barX    = COL.bar.x;
      const barY    = y + rowH / 2 - barH / 2 - 2;
      const fg      = statusFg(m.status);

      progressBar(doc, barX, barY, barW, barH, m.progress, fg);

      // % text (right of bar)
      bold(doc, 9);
      color(doc, fg);
      doc.text(`${m.progress}%`, barX + barW + 1, barY + barH - 0.3, { align: "left" });

      // tasks count (below bar)
      normal(doc, 6);
      color(doc, C.mgray);
      doc.text(`${done}/${total} tasks`, barX, barY + barH + 3.5);

      // ── STATUS BADGE ────────────────────────────────────────────────────
      const sFg    = statusFg(m.status);
      const sBg    = statusBg(m.status);
      const badge  = statusText(m.status);
      const bdgW   = 24, bdgH = 6.5;
      const bdgX   = COL.status.x + (COL.status.w - bdgW) / 2;
      const bdgY   = y + rowH / 2 - bdgH / 2;

      fill(doc, sBg);
      roundRect(doc, bdgX, bdgY, bdgW, bdgH, 3.2);
      bold(doc, 6.5);
      color(doc, sFg);
      doc.text(badge, bdgX + bdgW / 2, bdgY + 4.3, { align: "center" });

      y += rowH;
    }

    y += 4; // gap between phases
  }

  // ── FOOTERS (go back and stamp every page with correct total) ─────────────
  // jsPDF doesn't allow editing previous pages easily, so we draw all footers
  // during the main pass with placeholder totals, and then re-draw on the last page.
  // Simplest: just stamp all pages at the end using getNumberOfPages().
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`hexa-automation-progress-${new Date().toISOString().slice(0, 10)}.pdf`);
}
