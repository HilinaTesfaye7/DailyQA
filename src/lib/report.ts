// Shared, dependency-free helpers for project daily/weekly/monthly reports.
// Used by both the export API route (server) and the Export Report tab (client).

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const ETHIOPIA_TZ = 'Africa/Addis_Ababa';

/** Today's date (YYYY-MM-DD) in Ethiopia time, matching CheckIn.ethiopiaDate. */
export function getEthiopiaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ETHIOPIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isValidDateString(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function isReportPeriod(value: string | null | undefined): value is ReportPeriod {
  return value === 'daily' || value === 'weekly' || value === 'monthly';
}

const toUtcDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const toYmd = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

/**
 * Inclusive date range (YYYY-MM-DD strings) for a report period.
 * Weekly = Monday–Sunday week containing the anchor; monthly = calendar month.
 */
export function getReportRange(period: ReportPeriod, anchor: string) {
  const date = toUtcDate(anchor);

  if (period === 'weekly') {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    const start = new Date(date);
    start.setUTCDate(date.getUTCDate() - mondayOffset);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return {
      start: toYmd(start),
      end: toYmd(end),
      label: `Week of ${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`,
    };
  }

  if (period === 'monthly') {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    return {
      start: toYmd(start),
      end: toYmd(end),
      label: fmt(start, { month: 'long', year: 'numeric' }),
    };
  }

  return {
    start: anchor,
    end: anchor,
    label: fmt(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

export type ReportCheckIn = {
  id: string;
  date: string | Date;
  ethiopiaDate: string;
  testerId: string;
  moduleId: string | null;
  workCompleted: string;
  hasBlocker: boolean;
  blockerDescription: string | null;
  nextPlan: string;
  achievement: string;
  testsExecuted: number;
  testsPassed: number;
  testsFailed: number;
  testsBlocked: number;
  tester?: { fullName: string } | null;
  module?: { name: string } | null;
  blockers?: { status: string }[];
};

export function filterCheckInsByRange<T extends { ethiopiaDate: string }>(
  checkIns: T[],
  range: { start: string; end: string }
) {
  return checkIns.filter(ci => ci.ethiopiaDate >= range.start && ci.ethiopiaDate <= range.end);
}

/**
 * Test counts in check-ins are cumulative snapshots, so the summary uses the
 * latest check-in per tester/module in the period (same rule as the dashboard).
 */
export function summarizeCheckIns(checkIns: ReportCheckIn[]) {
  const latest = new Map<string, ReportCheckIn>();
  for (const ci of checkIns) {
    const key = `${ci.testerId}-${ci.moduleId || 'FULL_PROJECT'}`;
    const existing = latest.get(key);
    if (!existing || new Date(ci.date).getTime() > new Date(existing.date).getTime()) {
      latest.set(key, ci);
    }
  }

  let testsExecuted = 0, testsPassed = 0, testsFailed = 0, testsBlocked = 0;
  for (const ci of latest.values()) {
    testsExecuted += ci.testsExecuted;
    testsPassed += ci.testsPassed;
    testsFailed += ci.testsFailed;
    testsBlocked += ci.testsBlocked;
  }

  const blockersRaised = checkIns.filter(ci => ci.hasBlocker).length;
  const blockersOpen = checkIns.reduce(
    (n, ci) => n + (ci.blockers?.filter(b => b.status === 'OPEN').length || 0),
    0
  );
  const achievements = checkIns.filter(
    ci => ci.achievement && ci.achievement.trim().toLowerCase() !== 'none'
  ).length;

  return {
    totalCheckIns: checkIns.length,
    testers: new Set(checkIns.map(ci => ci.testerId)).size,
    daysReported: new Set(checkIns.map(ci => ci.ethiopiaDate)).size,
    testsExecuted,
    testsPassed,
    testsFailed,
    testsBlocked,
    passRate: testsExecuted > 0 ? Math.round((testsPassed / testsExecuted) * 100) : 0,
    blockersRaised,
    blockersOpen,
    achievements,
  };
}

export function formatEthiopiaTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    timeZone: ETHIOPIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function blockerStatusOf(ci: ReportCheckIn) {
  if (!ci.hasBlocker) return 'None';
  return ci.blockers?.some(b => b.status === 'OPEN') ? 'Open' : 'Resolved';
}

export function reportFileName(projectName: string, period: ReportPeriod, range: { start: string; end: string }) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const span = range.start === range.end ? range.start : `${range.start}_to_${range.end}`;
  return `${slug}-${period}-report-${span}`;
}

// ---------- CSV ----------

const csvCell = (value: unknown) => {
  let s = value === null || value === undefined ? '' : String(value);
  // Neutralise spreadsheet formula injection from user-submitted Telegram text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildReportCsv(opts: {
  projectName: string;
  period: ReportPeriod;
  range: { start: string; end: string; label: string };
  checkIns: ReportCheckIn[];
  generatedAt: Date;
}) {
  const { projectName, period, range, checkIns, generatedAt } = opts;
  const s = summarizeCheckIns(checkIns);
  const lines: unknown[][] = [
    ['Project', projectName],
    ['Report', `${period[0].toUpperCase()}${period.slice(1)} report`],
    ['Period', range.label],
    ['Date range', `${range.start} to ${range.end}`],
    ['Generated', generatedAt.toLocaleString('en-GB', { timeZone: ETHIOPIA_TZ }) + ' (EAT)'],
    [],
    ['Summary'],
    ['Check-ins', s.totalCheckIns],
    ['Testers reporting', s.testers],
    ['Days with reports', s.daysReported],
    ['Tests executed (latest)', s.testsExecuted],
    ['Tests passed (latest)', s.testsPassed],
    ['Tests failed (latest)', s.testsFailed],
    ['Tests blocked (latest)', s.testsBlocked],
    ['Pass rate', `${s.passRate}%`],
    ['Blockers raised', s.blockersRaised],
    ['Blockers still open', s.blockersOpen],
    [],
    [
      'Date', 'Time (EAT)', 'Tester', 'Module', 'Work completed', 'Blocker', 'Blocker description',
      'Blocker status', 'Next plan', 'Achievement', 'Executed', 'Passed', 'Failed', 'Blocked',
    ],
    ...checkIns.map(ci => [
      ci.ethiopiaDate,
      formatEthiopiaTime(ci.date),
      ci.tester?.fullName || 'Unknown',
      ci.module?.name || 'Full Project',
      ci.workCompleted,
      ci.hasBlocker ? 'Yes' : 'No',
      ci.blockerDescription || '',
      blockerStatusOf(ci),
      ci.nextPlan,
      ci.achievement,
      ci.testsExecuted,
      ci.testsPassed,
      ci.testsFailed,
      ci.testsBlocked,
    ]),
  ];
  // BOM so Excel opens UTF-8 (Amharic names, emoji) correctly.
  return '﻿' + lines.map(row => row.map(csvCell).join(',')).join('\r\n');
}

// ---------- Printable HTML (Save as PDF) ----------

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function buildReportHtml(opts: {
  projectName: string;
  period: ReportPeriod;
  range: { start: string; end: string; label: string };
  checkIns: ReportCheckIn[];
  generatedAt: Date;
}) {
  const { projectName, period, range, checkIns, generatedAt } = opts;
  const s = summarizeCheckIns(checkIns);
  const periodTitle = `${period[0].toUpperCase()}${period.slice(1)} QA Report`;
  const stat = (label: string, value: string | number, tone = '') =>
    `<div class="stat ${tone}"><div class="v">${esc(value)}</div><div class="l">${esc(label)}</div></div>`;

  const rows = checkIns
    .map(ci => {
      const status = blockerStatusOf(ci);
      return `<tr>
        <td class="nowrap">${esc(ci.ethiopiaDate)}<div class="muted">${esc(formatEthiopiaTime(ci.date))}</div></td>
        <td><strong>${esc(ci.tester?.fullName || 'Unknown')}</strong><div class="muted">${esc(ci.module?.name || 'Full Project')}</div></td>
        <td>${esc(ci.workCompleted)}</td>
        <td>${ci.hasBlocker ? `<span class="pill ${status === 'Open' ? 'red' : 'green'}">${esc(status)}</span><div>${esc(ci.blockerDescription)}</div>` : '<span class="muted">None</span>'}</td>
        <td>${esc(ci.nextPlan)}</td>
        <td>${esc(ci.achievement)}</td>
        <td class="num">${ci.testsExecuted}</td>
        <td class="num">${ci.testsPassed}</td>
        <td class="num">${ci.testsFailed}</td>
        <td class="num">${ci.testsBlocked}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(projectName)} – ${esc(periodTitle)} (${esc(range.label)})</title>
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --accent:#0284c7; --red:#e11d48; --green:#059669; --amber:#d97706; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Ethiopic", Arial, sans-serif; color: var(--ink); background: #fff; font-size: 13px; }
  .page { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-bottom: 2px solid var(--ink); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .eyebrow { color: var(--accent); font-weight: 700; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin: 4px 0 2px; font-size: 26px; }
  .muted { color: var(--muted); font-size: 11px; }
  .meta { text-align: right; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 24px; }
  .stat { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  .stat .v { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .stat .l { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .stat.green .v { color: var(--green); } .stat.red .v { color: var(--red); } .stat.amber .v { color: var(--amber); }
  h2 { font-size: 15px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); border-bottom: 1px solid var(--ink); padding: 8px 6px; }
  td { border-bottom: 1px solid var(--line); padding: 8px 6px; vertical-align: top; white-space: pre-wrap; word-break: break-word; }
  tr { page-break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .nowrap { white-space: nowrap; }
  .pill { display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px; margin-bottom: 4px; }
  .pill.red { background: #ffe4e6; color: var(--red); } .pill.green { background: #d1fae5; color: var(--green); }
  .empty { padding: 48px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; }
  .toolbar { position: sticky; top: 0; background: #f8fafc; border-bottom: 1px solid var(--line); padding: 10px 24px; display: flex; justify-content: flex-end; gap: 8px; }
  .toolbar button { font: inherit; padding: 8px 14px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; font-weight: 600; }
  footer { margin-top: 24px; color: var(--muted); font-size: 11px; text-align: center; }
  @media print { .toolbar { display: none; } .page { padding: 0; max-width: none; } @page { size: A4 landscape; margin: 12mm; } }
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <header>
    <div>
      <div class="eyebrow">${esc(periodTitle)}</div>
      <h1>${esc(projectName)}</h1>
      <div class="muted">${esc(range.label)} · ${esc(range.start)}${range.start !== range.end ? ` to ${esc(range.end)}` : ''}</div>
    </div>
    <div class="meta muted">Generated ${esc(generatedAt.toLocaleString('en-GB', { timeZone: ETHIOPIA_TZ }))} (EAT)<br/>QA Command Center</div>
  </header>

  <div class="stats">
    ${stat('Check-ins', s.totalCheckIns)}
    ${stat('Testers reporting', s.testers)}
    ${stat('Tests executed', s.testsExecuted)}
    ${stat('Passed', s.testsPassed, 'green')}
    ${stat('Failed', s.testsFailed, s.testsFailed > 0 ? 'red' : '')}
    ${stat('Blocked', s.testsBlocked, s.testsBlocked > 0 ? 'amber' : '')}
    ${stat('Pass rate', `${s.passRate}%`)}
    ${stat('Open blockers', s.blockersOpen, s.blockersOpen > 0 ? 'red' : '')}
  </div>

  <h2>Standup entries</h2>
  ${checkIns.length === 0
    ? '<div class="empty">No standups were submitted for this project in this period.</div>'
    : `<table>
    <thead><tr>
      <th>Date</th><th>Tester / Module</th><th>Work completed</th><th>Blocker</th><th>Next plan</th><th>Achievement</th>
      <th class="num">Exec</th><th class="num">Pass</th><th class="num">Fail</th><th class="num">Blk</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`}
  <footer>Test totals use each tester's latest check-in per module within the period.</footer>
</div>
</body>
</html>`;
}
