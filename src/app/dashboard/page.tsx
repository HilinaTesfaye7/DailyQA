import { prisma } from '@/lib/db';
import Link from 'next/link';
import DashboardFiltersClient from './DashboardFiltersClient';
import { getSession } from '@/lib/auth';
import { ETHIOPIA_TZ, formatEthiopiaTime, getEthiopiaToday, getReportRange } from '@/lib/report';

export const dynamic = 'force-dynamic';

const CLOSED_STATUSES = ['COMPLETED', 'INACTIVE'];

const TIMEFRAME_LABELS: Record<string, string> = {
  daily: 'today',
  weekly: 'this week',
  monthly: 'this month',
  yearly: 'this year',
};

function KpiCard({ label, value, foot, icon, tone }: { label: string; value: string | number; foot: string; icon: string; tone: string }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-head">
        <span>{label}</span>
        <span className="kpi-icon" style={{ background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}>{icon}</span>
      </div>
      <span className="kpi-value">{value}</span>
      <span className="kpi-foot" style={{ color: tone }}>{foot}</span>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const session = await getSession();
  const projectIdFilter = typeof params.projectId === 'string' ? params.projectId : 'all';
  const timeframeFilter = typeof params.timeframe === 'string' && params.timeframe in TIMEFRAME_LABELS ? params.timeframe : 'daily';

  const ethiopiaToday = getEthiopiaToday();
  const now = new Date();
  const displayDate = now.toLocaleDateString('en-US', { timeZone: ETHIOPIA_TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
  const hour = Number(now.toLocaleString('en-US', { timeZone: ETHIOPIA_TZ, hour: 'numeric', hour12: false })) % 24;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Timeframe filter on CheckIn.ethiopiaDate (YYYY-MM-DD, Ethiopia time) so "today" matches the bot.
  let startDate = ethiopiaToday;
  if (timeframeFilter === 'weekly') startDate = getReportRange('weekly', ethiopiaToday).start;
  else if (timeframeFilter === 'monthly') startDate = getReportRange('monthly', ethiopiaToday).start;
  else if (timeframeFilter === 'yearly') startDate = `${ethiopiaToday.slice(0, 4)}-01-01`;
  const checkInDateWhere = { ethiopiaDate: { gte: startDate, lte: ethiopiaToday } };
  const timeframeLabel = TIMEFRAME_LABELS[timeframeFilter];

  const projectWhere = projectIdFilter !== 'all' ? { id: projectIdFilter } : {};

  const [projects, allProjectsList, allTesters, checkInsData, allOpenBlockers] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: {
        assignments: true,
        modules: true,
        // All check-ins: readiness reflects the current state, not just the timeframe.
        checkIns: {
          include: { blockers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.project.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: 'asc' } }),
    prisma.tester.findMany({ include: { assignments: { select: { projectId: true } } } }),
    prisma.checkIn.findMany({
      where: {
        ...checkInDateWhere,
        ...(projectIdFilter !== 'all' ? { projectId: projectIdFilter } : {})
      },
      include: { tester: true, project: true },
      orderBy: { date: 'desc' },
      take: 6
    }),
    prisma.blocker.findMany({
      where: {
        status: 'OPEN',
        ...(projectIdFilter !== 'all' ? { checkIn: { projectId: projectIdFilter } } : {})
      },
      select: { id: true }
    }),
  ]);

  const activeProjectsCount = allProjectsList.filter(p => !CLOSED_STATUSES.includes(p.status)).length;
  const activeTesters = allTesters.filter(t => t.status === 'ACTIVE');
  const pendingTesters = allTesters.filter(t => t.status === 'PENDING_ASSIGNMENT').length;
  const openBlockersCount = allOpenBlockers.length;

  const projectStats = projects.map(project => {
    const totalTests = project.assignments.reduce((n, a) => n + (a.totalTests || 0), 0);

    // Test counts are cumulative snapshots: use the latest check-in per tester/module.
    const latestCheckInsMap = new Map<string, (typeof project.checkIns)[number]>();
    project.checkIns.forEach(ci => {
      const key = `${ci.testerId}-${ci.moduleId || 'FULL_PROJECT'}`;
      const existing = latestCheckInsMap.get(key);
      if (!existing || new Date(ci.date).getTime() > new Date(existing.date).getTime()) {
        latestCheckInsMap.set(key, ci);
      }
    });

    let testsExecuted = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    latestCheckInsMap.forEach(ci => {
      testsExecuted += ci.testsExecuted;
      testsPassed += ci.testsPassed;
      testsFailed += ci.testsFailed;
    });

    const openBlockers = project.checkIns.reduce((n, ci) => n + ci.blockers.filter(b => b.status === 'OPEN').length, 0);

    const checkInCount = project.checkIns.filter(ci => ci.ethiopiaDate >= startDate && ci.ethiopiaDate <= ethiopiaToday).length;

    const progress = totalTests > 0 ? Math.min(100, Math.round((testsPassed / totalTests) * 100)) : 0;
    const isReady = totalTests > 0 && testsPassed >= totalTests && openBlockers === 0;

    const moduleStats = project.modules.map(mod => {
      const modTotalTests = project.assignments.filter(a => a.moduleId === mod.id).reduce((n, a) => n + (a.totalTests || 0), 0);
      let modTestsPassed = 0;
      latestCheckInsMap.forEach(ci => {
        if (ci.moduleId === mod.id) modTestsPassed += ci.testsPassed;
      });
      const modProgress = modTotalTests > 0 ? Math.min(100, Math.round((modTestsPassed / modTotalTests) * 100)) : 0;
      return { id: mod.id, name: mod.name, progress: modProgress };
    });

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progress,
      isReady,
      testsFailed,
      openBlockers,
      checkInCount,
      testsExecuted,
      testsPassed,
      members: new Set(project.assignments.map(a => a.testerId)).size,
      moduleStats,
    };
  });

  const sum = (key: 'testsExecuted' | 'testsPassed' | 'testsFailed' | 'checkInCount') => projectStats.reduce((n, p) => n + p[key], 0);
  const totalTestsExecuted = sum('testsExecuted');
  const totalTestsPassed = sum('testsPassed');
  const totalTestsFailed = sum('testsFailed');
  const totalCheckIns = sum('checkInCount');

  const overallPassRate = totalTestsExecuted > 0 ? Math.round((totalTestsPassed / totalTestsExecuted) * 100) : 0;

  // Workload: same scale as the Team page (assignments across distinct projects).
  const workload = activeTesters
    .map(t => {
      const projectCount = new Set(t.assignments.map(a => a.projectId)).size;
      const load = t.assignments.length === 0 ? 0 : t.assignments.length === 1 ? 25 : t.assignments.length === 2 ? 50 : Math.min(100, 50 + (t.assignments.length - 2) * 15);
      return { id: t.id, name: t.fullName, projectCount, load };
    })
    .sort((a, b) => b.load - a.load)
    .slice(0, 5);

  const focus = projectStats.find(p => !CLOSED_STATUSES.includes(p.status)) || projectStats[0];

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>📅 {displayDate}</span>
          </div>
          <h1 className="page-title">{greeting}, {session?.username || 'QA Lead'}</h1>
          <p className="page-subtitle">Live QA status across active projects and Telegram standups — showing {timeframeLabel}.</p>
        </div>
        <DashboardFiltersClient projects={allProjectsList} activeProjectsCount={activeProjectsCount} />
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Active projects" value={activeProjectsCount} foot={`${allProjectsList.length} total projects`} icon="📁" tone="#38bdf8" />
        <KpiCard label="QA members" value={allTesters.length} foot={`${activeTesters.length} active · ${pendingTesters} pending`} icon="👥" tone="#a855f7" />
        <KpiCard label="Standups" value={totalCheckIns} foot={`Submitted ${timeframeLabel}`} icon="🗓" tone="#10b981" />
        <KpiCard label="Test pass rate" value={`${overallPassRate}%`} foot={`${totalTestsPassed} of ${totalTestsExecuted} passed (latest)`} icon="◎" tone="#38bdf8" />
        <KpiCard label="Failed tests" value={totalTestsFailed} foot={totalTestsFailed > 0 ? 'Needs attention' : 'No failures reported'} icon="✕" tone={totalTestsFailed > 0 ? '#f59e0b' : '#10b981'} />
        <KpiCard label="Open blockers" value={openBlockersCount} foot={openBlockersCount > 0 ? 'Blocking release' : 'All clear'} icon="⚡" tone={openBlockersCount > 0 ? '#f43f5e' : '#10b981'} />
      </div>

      {/* Middle Row */}
      <div className="grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
            <div>
              <h2 className="card-title">QA team workload</h2>
              <span className="card-subtitle">Allocation across {activeTesters.length} active members</span>
            </div>
            <Link href="/dashboard/testers" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Manage team ↗</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workload.length === 0 && <div className="empty-state">No active testers yet.</div>}
            {workload.map(w => {
              const tone = w.load >= 80 ? 'var(--danger)' : w.load >= 50 ? 'var(--warning)' : 'var(--primary)';
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar">{w.name.substring(0, 2).toUpperCase()}</div>
                  <div style={{ width: '120px', minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{w.projectCount} project{w.projectCount === 1 ? '' : 's'}</div>
                  </div>
                  <div className="progress-container" style={{ flex: 1, height: '8px', background: 'var(--bg-body)' }}>
                    <div className="progress-fill" style={{ width: `${w.load}%`, background: tone }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, width: '40px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{w.load}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
            <div>
              <h2 className="card-title">Release readiness</h2>
              <span className="card-subtitle">{focus?.name || 'No projects yet'}</span>
            </div>
            {focus && (focus.isReady ? (
              <span className="badge badge-success">Ready</span>
            ) : focus.openBlockers > 0 ? (
              <span className="badge badge-danger">Blocked</span>
            ) : (
              <span className="badge badge-blue">In testing</span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--bg-body)" strokeWidth="8" />
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke={focus?.isReady ? '#10b981' : '#38bdf8'} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - ((focus?.progress || 0) / 100) * circumference} />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: focus?.isReady ? '#10b981' : 'var(--text-main)' }}>{focus?.progress || 0}%</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>QA complete</span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {(focus?.moduleStats || []).length > 0 ? (
                focus!.moduleStats.map(mod => (
                  <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '4px', background: 'var(--bg-body)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${mod.progress}%`, height: '100%', background: mod.progress === 100 ? '#10b981' : '#38bdf8' }} />
                      </div>
                      <span style={{ fontWeight: 600, width: '34px', textAlign: 'right', color: mod.progress === 100 ? '#10b981' : 'var(--text-main)' }}>{mod.progress}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Failed tests</span>
                    <span style={{ color: (focus?.testsFailed || 0) > 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{focus?.testsFailed || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Open blockers</span>
                    <span style={{ color: (focus?.openBlockers || 0) > 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{focus?.openBlockers || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {focus && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Link href={`/dashboard/projects/${focus.id}`} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>Open project ↗</Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2-1">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
            <div>
              <h2 className="card-title">Project progress</h2>
              <span className="card-subtitle">Current quality status · standups {timeframeLabel}</span>
            </div>
            <Link href="/dashboard/projects/new" className="btn btn-accent btn-sm" title="New project">+ New</Link>
          </div>

          {projectStats.length === 0 ? (
            <div className="empty-state">No projects yet. Create one to get started.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: '560px' }}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>QA progress</th>
                    <th className="num">Standups</th>
                    <th className="num">Failed</th>
                    <th className="num">Blockers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectStats.slice(0, 8).map(p => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/dashboard/projects/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</Link>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>👥 {p.members} members</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-container" style={{ width: '90px', height: '6px', background: 'var(--bg-body)' }}>
                            <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.isReady ? '#10b981' : '#38bdf8' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{p.progress}%</span>
                        </div>
                      </td>
                      <td className="num">{p.checkInCount}</td>
                      <td className="num" style={{ color: p.testsFailed > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{p.testsFailed}</td>
                      <td className="num" style={{ color: p.openBlockers > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{p.openBlockers}</td>
                      <td>
                        <span className={`badge ${p.status === 'BLOCKED' ? 'badge-danger' : CLOSED_STATUSES.includes(p.status) ? 'badge-warning' : p.isReady || p.status === 'READY FOR RELEASE' ? 'badge-success' : 'badge-blue'}`} style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                          {p.status === 'ACTIVE' ? 'IN PROGRESS' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '460px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
            <div>
              <h2 className="card-title">Team activity</h2>
              <span className="card-subtitle">Latest Telegram standups</span>
            </div>
            <Link href="/dashboard/checkins" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>View all ↗</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {checkInsData.map(ci => (
              <div key={ci.id} style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="avatar">{ci.tester.fullName.charAt(0).toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{ci.tester.fullName}</span> submitted a standup
                    {ci.hasBlocker && <span className="badge badge-danger" style={{ marginLeft: '0.4rem', fontSize: '0.55rem' }}>Blocker</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ci.project.name} • {ci.workCompleted}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                    {ci.ethiopiaDate === ethiopiaToday ? 'Today' : ci.ethiopiaDate} · {formatEthiopiaTime(ci.date)} · ✈ Telegram
                  </div>
                </div>
              </div>
            ))}
            {checkInsData.length === 0 && (
              <div className="empty-state">No team activity recorded {timeframeLabel}.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
