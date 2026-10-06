import { prisma } from '@/lib/db';
import Link from 'next/link';
import DashboardFiltersClient from './DashboardFiltersClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const projectIdFilter = typeof params.projectId === 'string' ? params.projectId : 'all';
  const timeframeFilter = typeof params.timeframe === 'string' ? params.timeframe : 'daily';

  const options: Intl.DateTimeFormatOptions = { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const ethiopiaToday = formatter.format(new Date());
  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  // Timeframe date calculation
  const now = new Date();
  let startDateFilter = new Date(0); // Default to beginning of time if no filter
  if (timeframeFilter === 'daily') {
    startDateFilter = new Date();
    startDateFilter.setHours(0,0,0,0);
  } else if (timeframeFilter === 'weekly') {
    startDateFilter = new Date();
    startDateFilter.setDate(now.getDate() - 7);
  } else if (timeframeFilter === 'yearly') {
    startDateFilter = new Date();
    startDateFilter.setMonth(0, 1);
    startDateFilter.setHours(0,0,0,0);
  }

  // Base project query filter
  const projectWhere = projectIdFilter !== 'all' ? { id: projectIdFilter } : {};

  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      assignments: true,
      modules: true,
      subProjects: { include: { modules: true } },
      checkIns: { 
        where: { date: { gte: startDateFilter } },
        include: { blockers: true, tester: true } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Need all projects just for the dropdown list
  const allProjectsList = await prisma.project.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: 'asc' } });
  const activeProjectsCount = allProjectsList.filter(p => p.status === 'ACTIVE').length;

  const allTesters = await prisma.tester.findMany({
    include: { assignments: { include: { project: true } } }
  });

  const checkInsData = await prisma.checkIn.findMany({
    where: { 
      date: { gte: startDateFilter },
      ...(projectIdFilter !== 'all' ? { projectId: projectIdFilter } : {})
    },
    include: { tester: true, blockers: true, project: true },
    orderBy: { date: 'desc' }
  });

  const activeTestersCount = allTesters.filter(t => t.status === 'ACTIVE').length;
  
  let totalTestsExecuted = 0;
  let totalTestsPassed = 0;
  let totalTasksInProgress = 0;
  
  const allOpenBlockers = await prisma.blocker.findMany({
    where: { 
      status: 'OPEN',
      checkIn: {
        date: { gte: startDateFilter },
        ...(projectIdFilter !== 'all' ? { projectId: projectIdFilter } : {})
      }
    },
    include: { checkIn: { include: { tester: true, project: true } } }
  });
  const openBlockersCount = allOpenBlockers.length;

  const projectStats = projects.map(project => {
    let totalTests = 0;
    project.assignments.forEach(a => {
      totalTests += a.totalTests || 0;
    });

    const latestCheckInsMap = new Map<string, any>();
    project.checkIns.forEach(ci => {
      const key = `${ci.testerId}-${ci.moduleId || 'FULL_PROJECT'}`;
      if (!latestCheckInsMap.has(key)) {
        latestCheckInsMap.set(key, ci);
      } else {
        const existing = latestCheckInsMap.get(key);
        if (new Date(ci.date).getTime() > new Date(existing.date).getTime()) {
          latestCheckInsMap.set(key, ci);
        }
      }
    });

    let testsExecuted = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    let testsBlocked = 0;

    Array.from(latestCheckInsMap.values()).forEach(ci => {
      testsExecuted += ci.testsExecuted;
      testsPassed += ci.testsPassed;
      testsFailed += ci.testsFailed;
      testsBlocked += ci.testsBlocked;
      totalTasksInProgress += 1;
    });

    let hasActiveBlocker = false;
    let openBlockersCountInProject = 0;
    project.checkIns.forEach(ci => {
      if (ci.blockers.some((b: any) => b.status === 'OPEN')) {
        hasActiveBlocker = true;
        openBlockersCountInProject++;
      }
    });

    totalTestsExecuted += testsExecuted;
    totalTestsPassed += testsPassed;

    const progress = totalTests > 0 ? Math.min(100, Math.round((testsPassed / totalTests) * 100)) : 0;
    const isReady = totalTests > 0 && testsPassed >= totalTests && !hasActiveBlocker;

    const moduleStats = project.modules.map(mod => {
      let modTotalTests = 0;
      project.assignments.filter(a => a.moduleId === mod.id).forEach(a => {
        modTotalTests += a.totalTests || 0;
      });
      let modTestsPassed = 0;
      Array.from(latestCheckInsMap.values()).forEach(ci => {
        if (ci.moduleId === mod.id) modTestsPassed += ci.testsPassed;
      });
      const modProgress = modTotalTests > 0 ? Math.min(100, Math.round((modTestsPassed / modTotalTests) * 100)) : 0;
      return { id: mod.id, name: mod.name, progress: modProgress };
    });

    return { ...project, progress, isReady, testsFailed, testsBlocked: openBlockersCountInProject, moduleStats };
  });

  const overallPassRate = totalTestsExecuted > 0 ? Math.round((totalTestsPassed / totalTestsExecuted) * 100) : 0;

  // Render SVG Circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPassRate / 100) * circumference;

  return (
    <div style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>📅</span>
            <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>{displayDate}</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Good evening, Sarah</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Live QA status across cloud database, active projects, and Telegram standups.</p>
        </div>
        <DashboardFiltersClient projects={allProjectsList} activeProjectsCount={activeProjectsCount} />
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active projects</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>📁</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{activeProjectsCount}</span>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{projects.length} total projects ↗</span>
        </div>
        
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QA members</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>👥</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{allTesters.length}</span>
          <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>{activeTestersCount} active engineers ↗</span>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks in progress</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>✅</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{totalTasksInProgress}</span>
          <span style={{ fontSize: '0.7rem', color: '#10b981' }}>{totalTasksInProgress} tasks under test</span>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open bugs</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>⚠️</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{openBlockersCount}</span>
          <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>⚠️ 0 high priority</span>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test pass rate</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>◎</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{overallPassRate}%</span>
          <span style={{ fontSize: '0.7rem', color: '#10b981' }}>↗ {totalTestsPassed} of {totalTestsExecuted} tests passed</span>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blocked work</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>⚡</div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{openBlockersCount}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{openBlockersCount} active blockers</span>
        </div>
      </div>

      {/* Middle Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>QA team workload</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live allocation across {activeTestersCount} active members</span>
            </div>
            <Link href="/dashboard/testers" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 500 }}>Manage QA team ↗</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {allTesters.slice(0,3).map(tester => (
              <div key={tester.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {tester.fullName.substring(0,2).toUpperCase()}
                </div>
                <div style={{ width: '100px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{tester.fullName}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>QA Tester</div>
                </div>
                <div className="progress-container" style={{ flex: 1, height: '8px', background: 'var(--bg-body)' }}>
                  <div className="progress-fill" style={{ width: `${tester.assignments.length > 0 ? 50 : 0}%`, background: tester.assignments.length > 2 ? 'var(--danger)' : '#38bdf8' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '60px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{tester.assignments.length > 0 ? 50 : 0}%</span>
                  <span style={{ fontSize: '0.65rem', color: tester.assignments.length > 2 ? 'var(--danger)' : '#10b981' }}>{tester.assignments.length > 2 ? 'High' : 'Low'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Release readiness</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{projectStats[0]?.name || 'N/A'}</span>
            </div>
            {projectStats[0]?.isReady ? (
              <span className="badge badge-success">READY</span>
            ) : (
              <span className="badge badge-blue">IN TESTING</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flex: 1 }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-body)" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke={projectStats[0]?.isReady ? "#10b981" : "#38bdf8"} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={circumference - ((projectStats[0]?.progress || 0) / 100) * circumference} style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: projectStats[0]?.isReady ? '#10b981' : 'var(--text-main)' }}>{projectStats[0]?.progress || 0}%</span>
                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>QA complete</span>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '100px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {(projectStats[0]?.moduleStats || []).length > 0 ? (
                projectStats[0].moduleStats.map((mod: any) => (
                  <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{mod.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '50px', height: '4px', background: 'var(--bg-body)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${mod.progress}%`, height: '100%', background: mod.progress === 100 ? '#10b981' : '#38bdf8' }} />
                      </div>
                      <span style={{ fontWeight: 600, width: '30px', textAlign: 'right', color: mod.progress === 100 ? '#10b981' : 'var(--text-main)' }}>{mod.progress}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pass rate</span>
                    <span style={{ fontWeight: 600 }}>{projectStats[0]?.progress || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Critical bugs</span>
                    <span style={{ color: (projectStats[0]?.testsFailed || 0) > 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{projectStats[0]?.testsFailed || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Blockers</span>
                    <span style={{ color: (projectStats[0]?.testsBlocked || 0) > 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{projectStats[0]?.testsBlocked || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Link href="/dashboard/projects" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 500 }}>Open release report ↗</Link>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Project progress</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality status across active projects</span>
            </div>
            <button style={{ background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer' }}>+</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Project</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>QA Progress</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Bugs</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Testing</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.slice(0, 4).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--primary)', opacity: 0.8 }}></div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <div className="progress-container" style={{ width: '80px', height: '6px', background: 'var(--bg-body)' }}>
                      <div className="progress-fill" style={{ width: `${p.progress}%`, background: '#38bdf8' }} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.testsFailed}</td>
                  <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.isReady ? 'Done' : 'Testing'}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Team activity</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Telegram standups & blocker updates</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>⏱</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {checkInsData.slice(0, 3).map(ci => (
              <div key={ci.id} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>
                  {ci.tester.fullName.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600 }}>{ci.tester.fullName}</span> submitted daily standup <span style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>✈ Telegram</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ci.project.name} • {ci.workCompleted.substring(0,20)}...</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>Today</div>
                </div>
              </div>
            ))}
            {checkInsData.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No team activity recorded today.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
