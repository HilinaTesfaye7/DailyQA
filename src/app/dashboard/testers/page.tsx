import { prisma } from '@/lib/db';
import Link from 'next/link';

import DeleteTesterButton from './DeleteTesterButton';

export const dynamic = 'force-dynamic';

export default async function TestersPage() {
  const testers = await prisma.tester.findMany({
    orderBy: { registrationDate: 'desc' },
    include: {
      assignments: {
        include: {
          project: true,
          module: true
        }
      },
      checkIns: {
        orderBy: { date: 'desc' },
        take: 1,
        include: { blockers: true }
      }
    }
  });

  const activeTesters = testers.filter(t => t.status === 'ACTIVE');
  
  const activeProjects = await prisma.project.findMany({
    where: { status: { notIn: ['COMPLETED', 'INACTIVE'] } },
    select: { id: true, _count: { select: { assignments: true } } }
  });
  const staffedProjects = activeProjects.filter(p => p._count.assignments > 0).length;
  
  let overloadedCount = 0;
  activeTesters.forEach(t => {
    if (t.assignments.length > 2) overloadedCount++;
  });

  return (
    <div style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#38bdf8' }}>👥</span> QA Team & Personnel
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage QA engineers, workload balance, project assignments, and check-in history.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Team Size</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{testers.length} Engineers</span>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{activeTesters.length} Active Testers</span>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Projects</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{activeProjects.length} Projects</span>
          <span style={{ fontSize: '0.75rem', color: activeProjects.length - staffedProjects > 0 ? '#f59e0b' : '#10b981' }}>
            {staffedProjects} of {activeProjects.length} have testers assigned
          </span>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', border: overloadedCount > 0 ? '1px solid rgba(244,63,94,0.3)' : undefined }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overloaded Status</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: overloadedCount > 0 ? '#f43f5e' : 'var(--text-main)' }}>{overloadedCount} Members</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attention recommended</span>
        </div>
      </div>

      {/* Testers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {testers.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No QA members found.</div>
        )}
        
        {testers.map(tester => {
          const workloadScore = tester.assignments.length;
          const capacityPercent = workloadScore === 0 ? 0 : workloadScore === 1 ? 25 : workloadScore === 2 ? 50 : 80;
          const capacityText = workloadScore === 0 ? 'Low' : workloadScore <= 2 ? 'Optimal' : 'High';
          
          const latestCheckin = tester.checkIns[0];
          const isPending = tester.assignments.length === 0;

          return (
            <div key={tester.id} className="card" style={{ padding: '1.5rem' }}>
              {/* Profile Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', border: '1px solid rgba(56,189,248,0.3)' }}>
                    {tester.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}><Link href={`/dashboard/testers/${tester.id}`}>{tester.fullName}</Link></h2>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>✉ {tester.telegramId}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {isPending ? (
                    <>
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '4px', letterSpacing: '0.5px' }}>PENDING MEMBER</span>
                      <Link href={`/dashboard/testers/${tester.id}/assign`} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', borderColor: '#38bdf8', color: '#38bdf8', fontSize: '0.8rem' }}>Assign Project</Link>
                    </>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '4px', letterSpacing: '0.5px' }}>ACTIVE MEMBER</span>
                  )}
                  <DeleteTesterButton testerId={tester.id} />
                </div>
              </div>

              {/* Capacity Bar */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Capacity & Workload</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{capacityPercent}% ({capacityText})</span>
                </div>
                <div className="progress-container" style={{ height: '4px', background: 'var(--border-subtle)' }}>
                  <div className="progress-fill" style={{ width: `${capacityPercent}%`, background: '#38bdf8' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', background: 'var(--bg-body)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                {/* Project Allocations */}
                <div>
                  <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>Project Allocations</h3>
                  {tester.assignments.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No projects assigned yet.</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {tester.assignments.map(a => (
                        <span key={a.id} className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', padding: '0.25rem 0.75rem', borderRadius: '6px' }}>
                          {a.project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

                {/* Latest Standup */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Latest Standup</h3>
                    {latestCheckin ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Today:</span> {latestCheckin.workCompleted}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                          {latestCheckin.blockers.some(b => b.status === 'OPEN') ? (
                            <>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }}></div>
                              <span style={{ color: '#f43f5e' }}>Blockers: Active</span>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                              <span style={{ color: '#10b981' }}>Blockers: None</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No standups recorded.</div>
                    )}
                  </div>
                  {latestCheckin && (
                    <button className="btn" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.75rem', padding: '0.4rem 0.75rem', border: '1px solid rgba(56,189,248,0.2)' }}>
                      ✈️ Telegram
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
