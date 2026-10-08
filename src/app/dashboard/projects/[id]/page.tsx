import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProjectTabsClient from './ProjectTabsClient';
import DeleteProjectButton from './DeleteProjectButton';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ViewProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      modules: true,
      testCases: {
        include: { tester: true }
      },
      checkIns: {
        include: { blockers: true, tester: true, module: true },
        orderBy: { date: 'desc' }
      },
      assignments: {
        include: { tester: true, module: true }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const availableTesters = await prisma.tester.findMany();

  // Calculate Progress and Release Readiness
  let testsExecuted = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  let testsBlocked = 0;
  let totalTests = 0;
  let openBlockers = 0;

  const moduleMetrics: Record<string, any> = {};
  project.modules.forEach((m: any) => {
    moduleMetrics[m.id] = { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, totalTests: 0 };
  });
  moduleMetrics['FULL_PROJECT'] = { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, totalTests: 0 };

  project.assignments.forEach(a => {
    const mId = a.moduleId || 'FULL_PROJECT';
    if (!moduleMetrics[mId]) {
      moduleMetrics[mId] = { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, totalTests: 0 };
    }
    moduleMetrics[mId].totalTests += a.totalTests;
    totalTests += a.totalTests;
  });

  // Find the latest check-in for each tester per module for test counts
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

  // Calculate test counts from latest check-ins only
  Array.from(latestCheckInsMap.values()).forEach(ci => {
    testsExecuted += ci.testsExecuted;
    testsPassed += ci.testsPassed;
    testsFailed += ci.testsFailed;
    testsBlocked += ci.testsBlocked;

    const mId = ci.moduleId || 'FULL_PROJECT';
    if (!moduleMetrics[mId]) {
      moduleMetrics[mId] = { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, totalTests: 0 };
    }
    moduleMetrics[mId].testsExecuted += ci.testsExecuted;
    moduleMetrics[mId].testsPassed += ci.testsPassed;
    moduleMetrics[mId].testsFailed += ci.testsFailed;
    moduleMetrics[mId].testsBlocked += ci.testsBlocked;
  });

  // Calculate open blockers across ALL check-ins
  project.checkIns.forEach(ci => {
    let ciOpenBlockers = 0;
    ci.blockers.forEach(b => {
      if (b.status === 'OPEN') {
        openBlockers++;
        ciOpenBlockers++;
      }
    });

    const mId = ci.moduleId || 'FULL_PROJECT';
    if (!moduleMetrics[mId]) {
      moduleMetrics[mId] = { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, totalTests: 0 };
    }
    moduleMetrics[mId].openBlockers += ciOpenBlockers;
  });

  const progress = totalTests > 0 ? Math.min(100, Math.round((testsPassed / totalTests) * 100)) : 0;
  const isReady = totalTests > 0 && testsPassed >= totalTests && testsFailed === 0 && testsBlocked === 0 && openBlockers === 0;

  Object.keys(moduleMetrics).forEach(mId => {
    const met = moduleMetrics[mId];
    met.progress = met.totalTests > 0 ? Math.min(100, Math.round((met.testsPassed / met.totalTests) * 100)) : 0;
    met.isReady = met.totalTests > 0 && met.testsPassed >= met.totalTests && met.testsFailed === 0 && met.testsBlocked === 0 && met.openBlockers === 0;
  });

  const session = await getSession();
  const statusLabel = project.status === 'ACTIVE' ? 'IN PROGRESS' : project.status;
  const statusBadgeClass = project.status === 'BLOCKED' ? 'badge-danger'
    : project.status === 'COMPLETED' || project.status === 'READY FOR RELEASE' ? 'badge-success'
    : project.status === 'INACTIVE' ? 'badge-warning' : 'badge-blue';

  const uniqueMembersCount = new Set(project.assignments.map(a => a.testerId)).size;
  const dailyStandupsCount = project.checkIns.length;

  return (
    <div style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
            <span className={`badge ${statusBadgeClass}`} style={{ padding: '0.25rem 0.75rem', letterSpacing: '0.5px' }}>{statusLabel}</span>
            {isReady && <span className="badge badge-success" style={{ padding: '0.25rem 0.75rem' }}>✓ Release ready</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href={`/dashboard/projects/${project.id}/edit`} className="btn btn-outline">
              ✎ Edit Project
            </Link>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1rem' }}>
          {project.description || `Quality assurance and test automation suite for ${project.name}.`}
        </p>

        {/* Delivery Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>Delivery Progress</span>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{progress}%</span>
          </div>
          <div className="progress-container" style={{ height: '4px', background: 'var(--border-subtle)' }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: '#38bdf8' }} />
          </div>
        </div>

        {/* Metadata Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>QA Lead</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{session?.username || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Product Owner</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{project.productOwner || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Start Date</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8' }}>{project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Target Delivery</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8' }}>{project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '—'}</div>
          </div>
        </div>
      </div>

      <ProjectTabsClient 
        project={project} 
        uniqueMembersCount={uniqueMembersCount}
        dailyStandupsCount={dailyStandupsCount}
        isReady={isReady}
        openBlockers={openBlockers}
        progress={progress}
        testsExecuted={testsExecuted}
        testsPassed={testsPassed}
        testsFailed={testsFailed}
        testsBlocked={testsBlocked}
        availableTesters={availableTesters}
        moduleMetrics={moduleMetrics}
      />
    </div>
  );
}
