/**
 * generatePlanPDF — landscape A4 deck that reproduces the
 * "Hexa Finance Automation Plan — Malaysia First" slide deck.
 *
 * Fully manual jsPDF layout (no autoTable). Each slide is one page.
 * Two-column tables auto-paginate with the header band repeated if a
 * slide's content ever overflows a single page.
 */
import jsPDF from "jspdf";
import { INITIAL_MODULES } from "./data";
import { Module } from "./types";

// ─── palette ──────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C: Record<string, RGB> = {
  navy:      [15,  23,  42],   // page number / deep text
  band:      [31,  56,  100],  // table header band (deck navy-blue)
  title:     [75,  85,  99],   // slide title grey
  body:      [31,  41,  55],   // body text
  subtitle:  [21,  101, 192],  // blue subtitle
  white:     [255, 255, 255],
  altRow:    [246, 248, 251],
  border:    [223, 228, 236],
  faint:     [148, 163, 184],
  pink:      [233, 30,  140],
  purple:    [156, 39,  176],
  blue:      [33,  150, 243],
  green:     [22,  163, 74],
  orange:    [245, 124, 0],
  teal:      [0,   137, 123],
};

// ─── low-level helpers ──────────────────────────────────────────────────────
function fill(doc: jsPDF, c: RGB)   { doc.setFillColor(c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function color(doc: jsPDF, c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }
function bold(doc: jsPDF, sz: number)   { doc.setFont("helvetica", "bold");   doc.setFontSize(sz); }
function normal(doc: jsPDF, sz: number) { doc.setFont("helvetica", "normal"); doc.setFontSize(sz); }

// ─── page geometry (landscape A4) ────────────────────────────────────────────
const PW = 297, PH = 210;
const ML = 16, MR = 16;
const CW = PW - ML - MR;          // content width
const FOOTER_Y = PH - 8;
const TABLE_BOTTOM = PH - 14;     // last safe y for table content

// ─── decorative hexagon (title slide flourish) ──────────────────────────────
function hexagon(doc: jsPDF, cx: number, cy: number, r: number, c: RGB) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const segs: [number, number][] = [];
  for (let i = 1; i < 6; i++) {
    segs.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  fill(doc, c);
  doc.lines(segs, pts[0][0], pts[0][1], [1, 1], "F", true);
}

// ─── HEXA wordmark (top-right of content slides) ─────────────────────────────
function hexaMark(doc: jsPDF, rightX: number, y: number) {
  bold(doc, 13);
  const a = "HE", b = "XA";
  const wB = doc.getTextWidth(b);
  const wA = doc.getTextWidth(a);
  color(doc, C.purple);
  doc.text(a, rightX - wA - wB, y);
  color(doc, C.blue);
  doc.text(b, rightX - wB, y);
}

// ─── footer ──────────────────────────────────────────────────────────────────
function footer(doc: jsPDF, pageNum: number) {
  normal(doc, 6.5);
  color(doc, C.faint);
  doc.text("Commercial in Confidence", PW / 2, FOOTER_Y, { align: "center" });
  doc.text(String(pageNum), PW - MR, FOOTER_Y, { align: "right" });
}

// ─── slide chrome: grey title + HEXA mark, returns first content y ───────────
function slideHeader(doc: jsPDF, title: string): number {
  hexaMark(doc, PW - MR, 18);
  bold(doc, 22);
  color(doc, C.title);
  doc.text(title.toUpperCase(), ML, 22);
  return 32;
}

// ─── two-column table with navy header band + auto-pagination ────────────────
interface Row { c1: string; c2: string; }

function twoColTable(
  doc: jsPDF,
  state: { page: number },
  title: string,
  startY: number,
  col1Header: string,
  col2Header: string,
  col1W: number,
  rows: Row[],
) {
  const c1x = ML;
  const c2x = ML + col1W + 4;
  const c2w = CW - col1W - 4;
  const lineH = 4.3;
  const padY = 2.6;

  const drawBand = (y: number) => {
    fill(doc, C.band);
    doc.rect(ML, y, CW, 7.5, "F");
    bold(doc, 8.5);
    color(doc, C.white);
    doc.text(col1Header, c1x + 2.5, y + 5.1);
    doc.text(col2Header, c2x + 1, y + 5.1);
    return y + 7.5;
  };

  let y = drawBand(startY);
  let alt = false;

  for (const row of rows) {
    bold(doc, 8.5);
    const l1 = doc.splitTextToSize(row.c1, col1W - 4);
    normal(doc, 8.5);
    const l2 = doc.splitTextToSize(row.c2, c2w - 3);
    const rowH = Math.max(l1.length, l2.length) * lineH + padY * 2;

    // page break
    if (y + rowH > TABLE_BOTTOM) {
      footer(doc, state.page);
      doc.addPage();
      state.page++;
      const ny = slideHeader(doc, `${title} (cont.)`);
      y = drawBand(ny);
      alt = false;
    }

    if (alt) {
      fill(doc, C.altRow);
      doc.rect(ML, y, CW, rowH, "F");
    }
    alt = !alt;

    // bottom border
    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(ML, y + rowH, ML + CW, y + rowH);

    // col 1 (bold label)
    bold(doc, 8.5);
    color(doc, C.band);
    doc.text(l1, c1x + 2.5, y + padY + 3.1);

    // col 2 (body)
    normal(doc, 8.5);
    color(doc, C.body);
    doc.text(l2, c2x + 1, y + padY + 3.1);

    y += rowH;
  }
  return y;
}

// ─── checkbox glyph (build-plan checklist) ───────────────────────────────────
function checkbox(doc: jsPDF, x: number, baseY: number, done: boolean) {
  const s = 2.5;
  const top = baseY - s + 0.3;
  doc.setLineWidth(0.3);
  if (done) {
    fill(doc, C.green);
    stroke(doc, C.green);
    doc.roundedRect(x, top, s, s, 0.5, 0.5, "FD");
    stroke(doc, C.white);
    doc.setLineWidth(0.45);
    doc.line(x + 0.55, top + s * 0.55, x + 1.0, top + s - 0.5);
    doc.line(x + 1.0, top + s - 0.5, x + s - 0.4, top + 0.55);
  } else {
    stroke(doc, C.faint);
    doc.roundedRect(x, top, s, s, 0.5, 0.5, "S");
  }
}

// ─── build-plan slide: Dates | titled checklist (sourced from data.ts) ───────
function buildPlanTable(
  doc: jsPDF,
  state: { page: number },
  title: string,
  startY: number,
  mods: Module[],
) {
  const col1W = 32;
  const c1x = ML;
  const c2x = ML + col1W + 4;
  const c2w = CW - col1W - 4;
  const titleLineH = 4.2;
  const itemLineH = 3.9;
  const padY = 2.6;
  const indent = 5;

  const drawBand = (y: number) => {
    fill(doc, C.band);
    doc.rect(ML, y, CW, 7.5, "F");
    bold(doc, 8.5);
    color(doc, C.white);
    doc.text("Dates", c1x + 2.5, y + 5.1);
    doc.text("Module & What Gets Built (Malaysia)", c2x + 1, y + 5.1);
    return y + 7.5;
  };

  let y = drawBand(startY);
  let alt = false;

  for (const m of mods) {
    bold(doc, 8.5);
    const dateLines = doc.splitTextToSize(m.dates, col1W - 4);
    const titleLines = doc.splitTextToSize(m.title, c2w - 3);
    normal(doc, 7.5);
    const itemWrap = m.subTasks.map((t) => doc.splitTextToSize(t.title, c2w - indent - 4));
    const itemLineCount = itemWrap.reduce((s, l) => s + l.length, 0);

    const rowH = padY * 2 + titleLines.length * titleLineH + 1.5 + itemLineCount * itemLineH;

    if (y + rowH > TABLE_BOTTOM) {
      footer(doc, state.page);
      doc.addPage();
      state.page++;
      const ny = slideHeader(doc, `${title} (cont.)`);
      y = drawBand(ny);
      alt = false;
    }

    if (alt) { fill(doc, C.altRow); doc.rect(ML, y, CW, rowH, "F"); }
    alt = !alt;

    stroke(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(ML, y + rowH, ML + CW, y + rowH);

    // col 1 — dates
    bold(doc, 8.5);
    color(doc, C.band);
    doc.text(dateLines, c1x + 2.5, y + padY + 3.1);

    // col 2 — module title (bold), then checklist
    let ty = y + padY + 3.1;
    bold(doc, 8.5);
    color(doc, C.body);
    doc.text(titleLines, c2x + 1, ty);
    ty += titleLines.length * titleLineH + 1.5;

    normal(doc, 7.5);
    m.subTasks.forEach((t, i) => {
      checkbox(doc, c2x + 1, ty, t.completed);
      color(doc, t.completed ? C.faint : C.body);
      doc.text(itemWrap[i], c2x + 1 + indent, ty);
      ty += itemWrap[i].length * itemLineH;
    });

    y += rowH;
  }
  return y;
}

// ════════════════════════════════════════════════════════════════════════════
//  CONTENT
// ════════════════════════════════════════════════════════════════════════════
const PREPARED_BY = "Asim";
const PLAN_DATE = "3 June 2026";

const CONTENTS = [
  "Purpose & Background",
  "Malaysia Scope — Entities & What Gets Built",
  "The Problem — What We Are Fixing (Malaysia)",
  "APEX — CSI & Consultant Payment Automation",
  "CLEO — OPEX, Loans & Payables",
  "ARIA — AR, Invoicing & Collections",
  "Supporting Modules — Fund Flow, Bank Recon, Accruals",
  "Build Plan — Day by Day (3 Jun – 7 Jul)",
  "Benefits & What Changes for the Team",
  "Replication Roadmap — After Malaysia",
];

const SCOPE: Row[] = [
  { c1: "Entities", c2: "Hexamatics Servcomm Sdn Bhd (HSSB) and KISB. Primary EOR and consulting entities. Highest consultant volume in the group." },
  { c1: "Currency", c2: "MYR only. All Zoho postings, bank files, and statutory in Ringgit." },
  { c1: "Bank", c2: "Maybank RCGEN Domestic Payments. Bank file already generated by APEX. All payments through Maybank." },
  { c1: "Statutory obligations", c2: "EPF (KWSP), SOCSO (PERKESO), EIS, PCB/MTD, HRDF — all due 15th of following month. SST bi-monthly (last day of 2nd month). Form E by 31 Mar. EA Form by 28 Feb." },
  { c1: "Zoho Books", c2: "HSSB and KISB entities on Zoho Books. All journal entries, bills, and payments auto-posted via API already established from APEX." },
  { c1: "Payroll system", c2: "BrioHR — payroll register generated from BrioHR for internal employees. CSI payroll from HexaFlow APEX." },
  { c1: "Replication trigger", c2: "Once Malaysia is stable and one full close cycle is completed (target: July 2026), each other country gets its own sprint: Indonesia → Nepal → Singapore → Philippines → Myanmar." },
];

const PROBLEM: Row[] = [
  { c1: "Last-minute fund planning", c2: "HSSB EOR deficit RM 103k surfaced 2 days before 7 May payout. Project fund negative RM 15k and RM 77k on 1 May and 12 May. No 6-week rolling forecast in place." },
  { c1: "WhatsApp approvals — no audit trail", c2: "6 messages deleted from the HSSB/KISB payment approval channel in 2 weeks (4–14 May). No tamper-proof record. Director approvals not preserved." },
  { c1: "PIR before PR signed", c2: "HSSB payment initiated before Director PR approved. Hilton Kuching PIR rejected by Maybank — incorrect BRN passed through review. RM 10k advance batched with consultant salaries." },
  { c1: "EOR funds used as float", c2: "HSSB EOR ring-fenced funds used to cover operational deficits 3 cycles running: RM 15k, RM 103k, RM 77k. BNM regulatory violation risk." },
  { c1: "Month-end close: 6.5 weeks", c2: "HSSB/KISB April 2026 books closed 15–16 May. HCI recon still mismatched at 6:56 PM on 13 May. Bank recon and accruals incomplete morning of close day." },
  { c1: "No project P&L", c2: "Finance cannot produce P&L for Jendela (Malaysia) or Sacofa (RM 6.4m contract). Cash outflows in Excel, not in Zoho P&L format. Director asked mid-payout, answer was unavailable." },
  { c1: "Unsigned payroll report before invoice", c2: "Malaysia invoices raised without signed payroll report. Control introduced manually by Ujjwal on 12 May. Prior months' revenue trail potentially incomplete for HSSB." },
];

const PLATFORM: Row[] = [
  { c1: "APEX (HexaFlow)", c2: "CSI & consultant payment engine. CSI upload → validation → approval → Zoho COGS journal → Maybank bank file → payment → audit trail. LIVE for HSSB & KISB." },
  { c1: "CLEO (HexaFlow)", c2: "OPEX & payables automation. PR → HOF → Director (email token). Auto-creates Zoho bills on approval. Clears bill payment on payment. Loan schedule auto-triggered 25th monthly." },
  { c1: "ARIA (HexaFlow)", c2: "Automated Receivable Intelligent Agent. Malaysia invoice auto-generation from APEX. AR reminders, collection tracking, DAR, project P&L by Malaysia project code." },
  { c1: "HexaComply", c2: "Compliance calendar. Malaysia obligations: EPF, SOCSO, EIS, PCB, HRDF, SST, Form E, EA Form — all with real due dates and T-5 reminders. Triggers corrected 3–5 Jun." },
  { c1: "Fund Flow Dashboard", c2: "Cash ladder for HSSB and KISB. 6-week rolling forecast. T-5/T-3/T-1 payout alerts. EOR funds ring-fenced structurally. No more last-minute surprises." },
  { c1: "Bank Recon", c2: "Maybank statement auto-matched against Zoho. Unmatched transactions flagged. Recon report generated by 2nd of each month. HSSB and KISB accounts." },
  { c1: "Accruals Engine", c2: "8 monthly journals auto-posted on 1st and 4th. Depreciation, COGS, WIP, tax provision, audit fees, amortization, prepayments. Month-end close target: 15 working days." },
  { c1: "Interco Matrix", c2: "KISB–HSSB balance reconciliation, elimination journals, TP markup validation. Last working day auto-reconciliation. Mismatch flagged to CFO." },
];

const BENEFITS: Row[] = [
  { c1: "Hours → minutes per cycle", c2: "One CSI upload drives HSSB/KISB Zoho journals, Maybank bank file, and statutory output. No re-keying across 4 systems. Ranjana and Swostika freed from repetitive data entry." },
  { c1: "No more fund crises", c2: "6-week cash ladder for HSSB and KISB. T-5 alert if EOR or project funds are short before payout. RM 103k deficit situation becomes impossible — flagged 5 weeks early, not 2 days before." },
  { c1: "Month-end close in 15 days", c2: "8 accrual journals auto-posted on fixed dates. Maybank recon automated. April close took 6.5 weeks. Target after automation: 15 working days. IPO-ready cadence." },
  { c1: "Built-in financial controls", c2: "Maker-checker email approvals — no deletable WhatsApp messages. PR must exist before PIR. Signed payroll report required before invoice. Tamper-proof audit trail on every action." },
  { c1: "Live Malaysia project P&L", c2: "Jendela, Kuching, Sacofa P&L available in real time from ARIA. Director no longer has to ask Finance for a number that takes 2 days to produce." },
  { c1: "Statutory compliance automated", c2: "EPF, SOCSO, EIS, PCB/MTD, HRDF generated from the same APEX payroll data. HexaComply alerts 10/5/2 days before each 15th deadline. No more last-minute scramble." },
  { c1: "EOR funds protected", c2: "Structural separation of EOR ring-fenced funds and operational funds enforced in the system. Any deviation requires CFO override. BNM violation risk eliminated." },
  { c1: "Audit-ready books every month", c2: "AR/AP aging, bank recon, interco matrix, balance sheet schedules auto-generated. External auditors receive a complete, consistently formatted pack without manual preparation." },
];

const TEAM: Row[] = [
  { c1: "Ranjana & Swostika\n(Finance Executives)", c2: "Stop re-keying data across Zoho, Excel, and the bank portal. Upload CSI → system does the rest. Focus shifts entirely to exception review and escalation, not data entry." },
  { c1: "Ujjwal\n(Head of Finance)", c2: "Approves via secure email token, not WhatsApp. Fund position visible 6 weeks ahead. Exceptions surface automatically. Close tracked in real time. No longer a single point of failure." },
  { c1: "Ali\n(Finance Ops Lead)", c2: "Daily Director tracker auto-generated before the 20-min call. PIR check files in system, not assembled manually. Interco matrix and Malaysia project P&L always current. Can focus on strategic review." },
  { c1: "Ikhram\n(AR / CSI Generator)", c2: "CSI Generator connects to APEX via API. Payment confirmations flow back automatically. No manual handoffs. ARIA handles AR follow-up and collection escalation without manual intervention." },
  { c1: "Director\n(Dato' Thiru)", c2: "One approval click per payment. Live cash position for HSSB and KISB on dashboard. No surprises on payout day. Audit trail on every decision. Management accounts within 15 working days." },
  { c1: "External Auditors\n(FYE 2025 onwards)", c2: "All Malaysia audit schedules — FA register, AR/AP aging, Maybank recon, interco matrix, tax workings — auto-generated and consistently formatted every month." },
];

const ROADMAP: Row[] = [
  { c1: "Malaysia\n(HSSB & KISB)\nSprint 1", c2: "COMPLETE by 7 Jul 2026. Full stack: APEX, CLEO, ARIA, Fund Flow, Bank Recon, Accruals, Interco. Template for all subsequent countries." },
  { c1: "Indonesia\n(PTHIT)\nSprint 2 — Aug 2026", c2: "Replicate Malaysia template. Swap: Maybank → BCA/Mandiri bank file format. Statutory: BPJS Ketenagakerjaan (15th), BPJS Kesehatan (10th), PPh21 (10th). Currency: IDR. Zoho entity: PTHIT." },
  { c1: "Nepal\n(HNPL)\nSprint 3 — Sep 2026", c2: "Replicate template. Statutory: SSF (month-end), TDS on salary (15th). Currency: NPR. Payroll source: RigoHR instead of BrioHR. IRD payment confirmation required as evidence." },
  { c1: "Singapore\n(HSPL)\nSprint 4 — Oct 2026", c2: "Replicate template. Statutory: CPF e-submission (14th), GIRO confirmation. Currency: SGD. Bank: DBS/OCBC file format. CIT: ECI within 3 months FYE." },
  { c1: "Philippines\n(HCI)\nSprint 5 — Nov 2026", c2: "Replicate template. Statutory: SSS, PhilHealth, Pag-IBIG (10th–20th), BIR 1601-C (10th). Currency: PHP. Most complex statutory — multiple agencies, multiple due dates." },
  { c1: "Myanmar\n(HMCL)\nSprint 6 — Dec 2026", c2: "Replicate template. Statutory: SSC Form SSC-2 (15th), PIT withholding (10th). Currency: MMK. Note: Statutory audit pending from 2019 — system must accommodate MA-basis filing until audit is resolved." },
];

// ─── bullet paragraph block (Purpose slide) ──────────────────────────────────
function bulletBlock(
  doc: jsPDF,
  y: number,
  heading: string,
  body: string,
): number {
  bold(doc, 10);
  color(doc, C.band);
  doc.text(`•  ${heading}`, ML, y);
  y += 5.5;
  normal(doc, 9);
  color(doc, C.body);
  const lines = doc.splitTextToSize(body, CW - 6);
  doc.text(lines, ML + 6, y);
  return y + lines.length * 4.6 + 6;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════
export function generatePlanPDF() {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const state = { page: 1 };

  // ── SLIDE 1 — TITLE ─────────────────────────────────────────────────────
  fill(doc, C.white);
  doc.rect(0, 0, PW, PH, "F");

  // decorative hexagon cluster (right side)
  const hx = 232;
  hexagon(doc, hx + 20, 40, 16, C.teal);
  hexagon(doc, hx + 6,  62, 13, C.blue);
  hexagon(doc, hx + 40, 70, 15, [124, 179, 66]);   // light green
  hexagon(doc, hx,      92, 12, C.orange);
  hexagon(doc, hx + 30, 104, 14, C.blue);
  hexagon(doc, hx + 14, 124, 11, C.pink);
  hexagon(doc, hx + 44, 132, 13, C.purple);
  hexagon(doc, hx + 2,  150, 12, [124, 179, 66]);

  // HEXA wordmark top-left
  bold(doc, 16);
  color(doc, C.purple); doc.text("HE", ML, 22);
  const heW = doc.getTextWidth("HE");
  color(doc, C.blue);   doc.text("XA", ML + heW, 22);

  bold(doc, 30);
  color(doc, C.navy);
  doc.text("HEXA FINANCE AUTOMATION", ML, 92);
  doc.text("PLAN", ML, 104);

  bold(doc, 15);
  color(doc, C.subtitle);
  doc.text("Malaysia First — Full Finance Operations", ML, 122);
  doc.text("Automated by 7 July 2026", ML, 131);

  normal(doc, 10);
  color(doc, C.body);
  doc.text("PREPARED BY", ML, 158);
  doc.text(`:  ${PREPARED_BY}`, ML + 38, 158);
  doc.text("DATE", ML, 165);
  doc.text(`:  ${PLAN_DATE}`, ML + 38, 165);

  footer(doc, state.page);

  // ── SLIDE 2 — CONTENTS ──────────────────────────────────────────────────
  doc.addPage(); state.page++;
  let y = slideHeader(doc, "Contents");
  y += 4;
  CONTENTS.forEach((item, i) => {
    bold(doc, 10.5);
    color(doc, C.band);
    doc.text(`${i + 1}.`, ML, y);
    normal(doc, 10.5);
    color(doc, C.body);
    doc.text(item, ML + 10, y);
    y += 11;
  });
  footer(doc, state.page);

  // ── SLIDE 3 — PURPOSE & BACKGROUND ──────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Purpose & Background");
  y += 4;
  y = bulletBlock(doc, y, "WHY MALAYSIA FIRST",
    "Malaysia is the operational headquarters. HSSB and KISB process the highest volume of consultant payments, carry the most statutory obligations (EPF, SOCSO, EIS, PCB, HRDF, SST), and are the entities most exposed by the 53 audit observations. Build here first. Stabilise. Then replicate country by country.");
  y = bulletBlock(doc, y, "WHAT IS ALREADY LIVE",
    "APEX (HexaFlow) — CSI Flow is complete as of 3 June 2026. CSI upload → validation → maker-checker approval → Zoho accrual journal → Maybank RCGEN bank file → payment posting → SHA-256 audit trail. Malaysia entities: HSSB & KISB. HexaComply — Compliance calendar built. Due date fix and real triggers in progress (3–5 Jun).");
  y = bulletBlock(doc, y, "THE 30-DAY TARGET",
    "By 7 July 2026: every Malaysia finance operation — payments, payroll, AP, AR, bank recon, statutory, fund planning, intercompany, and month-end accruals — runs through an automated, audit-ready platform. Zero manual re-keying. Zero WhatsApp approvals.");
  footer(doc, state.page);

  // ── SLIDE 4 — MALAYSIA SCOPE ────────────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Malaysia Scope — HSSB & KISB");
  twoColTable(doc, state, "Malaysia Scope — HSSB & KISB", y, "Area", "Malaysia Scope (HSSB & KISB)", 44, SCOPE);
  footer(doc, state.page);

  // ── SLIDE 5 — THE PROBLEM ───────────────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "The Problem — Malaysia (HSSB & KISB)");
  twoColTable(doc, state, "The Problem — Malaysia", y, "Pain Point", "Malaysia Observation / Impact", 40, PROBLEM);
  footer(doc, state.page);

  // ── SLIDE 6 — BUILD PLAN PHASE 1 & 2 (checklist from data.ts) ───────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Build Plan — Phase 1 & 2: APEX, CLEO & Controls");
  buildPlanTable(doc, state, "Build Plan — Phase 1 & 2", y,
    INITIAL_MODULES.filter((m) => m.phase === 1 || m.phase === 2));
  footer(doc, state.page);

  // ── SLIDE 7 — BUILD PLAN PHASE 3 & 4 (checklist from data.ts) ───────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Build Plan — Phase 3 & 4: ARIA, Fund Flow & Consolidation");
  buildPlanTable(doc, state, "Build Plan — Phase 3 & 4", y,
    INITIAL_MODULES.filter((m) => m.phase === 3 || m.phase === 4));
  footer(doc, state.page);

  // ── SLIDE 8 — PLATFORM OVERVIEW ─────────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Platform Overview — Malaysia Stack");
  twoColTable(doc, state, "Platform Overview — Malaysia Stack", y, "Platform", "What It Does (Malaysia)", 40, PLATFORM);
  footer(doc, state.page);

  // ── SLIDE 9 — BENEFITS ──────────────────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Benefits — Malaysia Operations");
  twoColTable(doc, state, "Benefits — Malaysia Operations", y, "Benefit", "What It Means for Malaysia Operations", 42, BENEFITS);
  footer(doc, state.page);

  // ── SLIDE 10 — WHAT CHANGES FOR THE TEAM ────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "What Changes for the Team");
  twoColTable(doc, state, "What Changes for the Team", y, "Role", "How Their Work Changes After Automation", 46, TEAM);
  footer(doc, state.page);

  // ── SLIDE 11 — REPLICATION ROADMAP ──────────────────────────────────────
  doc.addPage(); state.page++;
  y = slideHeader(doc, "Replication Roadmap — After Malaysia");
  twoColTable(doc, state, "Replication Roadmap — After Malaysia", y, "Country / Entity", "Sprint Plan & Key Differences from Malaysia", 44, ROADMAP);
  footer(doc, state.page);

  doc.save(`hexa-finance-automation-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
}
