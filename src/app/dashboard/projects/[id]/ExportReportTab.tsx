'use client';

import { useMemo, useState } from 'react';
import {
  REPORT_PERIODS,
  blockerStatusOf,
  filterCheckInsByRange,
  formatEthiopiaTime,
  getEthiopiaToday,
  getReportRange,
  summarizeCheckIns,
  type ReportCheckIn,
  type ReportPeriod,
} from '@/lib/report';

export default function ExportReportTab({ projectId, projectName, checkIns }: { projectId: string; projectName: string; checkIns: ReportCheckIn[] }) {
  const today = getEthiopiaToday();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [anchor, setAnchor] = useState(today);

  const range = useMemo(() => getReportRange(period, anchor || today), [period, anchor, today]);
  const rows = useMemo(
    () =>
      filterCheckInsByRange(checkIns, range).sort(
        (a, b) => a.ethiopiaDate.localeCompare(b.ethiopiaDate) || new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [checkIns, range]
  );
  const summary = useMemo(() => summarizeCheckIns(rows), [rows]);

  const query = new URLSearchParams({ period, date: anchor || today });
  const csvUrl = `/api/projects/${projectId}/report?${query}&format=csv`;
  const htmlUrl = `/api/projects/${projectId}/report?${query}&format=html`;

  // Step the anchor date by one period (prev/next day, week or month).
  const shift = (dir: -1 | 1) => {
    const d = new Date(`${anchor || today}T00:00:00Z`);
    if (period === 'daily') d.setUTCDate(d.getUTCDate() + dir);
    else if (period === 'weekly') d.setUTCDate(d.getUTCDate() + 7 * dir);
    else d.setUTCMonth(d.getUTCMonth() + dir, 1);
    setAnchor(d.toISOString().slice(0, 10));
  };

  const stat = (label: string, value: string | number, color?: string) => (
    <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );

  return (
    <div className="card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Export Standup Report</h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Download {projectName}&apos;s daily standups for a day, week or month.
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Report type</span>
          <div className="segmented" role="group" aria-label="Report period">
            {REPORT_PERIODS.map(p => (
              <button key={p.value} className={period === p.value ? 'active' : ''} onClick={() => setPeriod(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="report-date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {period === 'daily' ? 'Date' : period === 'weekly' ? 'Any day in the week' : 'Any day in the month'}
          </label>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => shift(-1)} aria-label="Previous period">‹</button>
            <input
              id="report-date"
              type="date"
              className="input"
              style={{ width: 'auto' }}
              value={anchor}
              max={today}
              onChange={e => setAnchor(e.target.value)}
            />
            <button className="btn btn-outline btn-sm" onClick={() => shift(1)} disabled={range.end >= today} aria-label="Next period">›</button>
            {anchor !== today && (
              <button className="btn btn-outline btn-sm" onClick={() => setAnchor(today)}>Today</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <a href={csvUrl} download className="btn btn-primary">
            ⬇ Download Excel (CSV)
          </a>
          <a href={htmlUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">
            🖨 Print / Save as PDF
          </a>
        </div>
      </div>

      {/* Period summary */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
        <strong>{range.label}</strong>
        <span style={{ color: 'var(--text-muted)' }}>
          {' '}· {range.start}{range.start !== range.end ? ` → ${range.end}` : ''} · {summary.totalCheckIns} standup{summary.totalCheckIns === 1 ? '' : 's'} from {summary.testers} tester{summary.testers === 1 ? '' : 's'}
          {period !== 'daily' && ` over ${summary.daysReported} day${summary.daysReported === 1 ? '' : 's'}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
        {stat('Standups', summary.totalCheckIns)}
        {stat('Executed', summary.testsExecuted)}
        {stat('Passed', summary.testsPassed, 'var(--success)')}
        {stat('Failed', summary.testsFailed, summary.testsFailed > 0 ? 'var(--danger)' : undefined)}
        {stat('Blocked', summary.testsBlocked, summary.testsBlocked > 0 ? 'var(--warning)' : undefined)}
        {stat('Pass rate', `${summary.passRate}%`)}
        {stat('Open blockers', summary.blockersOpen, summary.blockersOpen > 0 ? 'var(--danger)' : undefined)}
      </div>

      {/* Preview */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Preview</h3>
        {rows.length === 0 ? (
          <div className="empty-state">No standups were submitted for this project in this period.</div>
        ) : (
          <div className="table-wrap" style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tester</th>
                  <th>Work completed</th>
                  <th>Blocker</th>
                  <th>Next plan</th>
                  <th>Achievement</th>
                  <th className="num">Exec / Pass / Fail / Blk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(ci => {
                  const status = blockerStatusOf(ci);
                  return (
                    <tr key={ci.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {ci.ethiopiaDate}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatEthiopiaTime(ci.date)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ci.tester?.fullName || 'Unknown'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ci.module?.name || 'Full Project'}</div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>{ci.workCompleted}</td>
                      <td style={{ maxWidth: '200px' }}>
                        {ci.hasBlocker ? (
                          <>
                            <span className={`badge ${status === 'Open' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.6rem' }}>{status}</span>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{ci.blockerDescription}</div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px' }}>{ci.nextPlan}</td>
                      <td style={{ maxWidth: '200px', color: 'var(--primary)' }}>{ci.achievement || '—'}</td>
                      <td className="num">
                        {ci.testsExecuted} / <span style={{ color: 'var(--success)' }}>{ci.testsPassed}</span> / <span style={{ color: 'var(--danger)' }}>{ci.testsFailed}</span> / <span style={{ color: 'var(--warning)' }}>{ci.testsBlocked}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Test totals use each tester&apos;s latest check-in per module within the period. Times are in East Africa Time (EAT).
        </p>
      </div>
    </div>
  );
}
