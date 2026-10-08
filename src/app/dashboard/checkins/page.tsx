import { prisma } from '@/lib/db';
import styles from './page.module.css';
import Filters from './Filters';
import { Prisma } from '@prisma/client';
import { formatEthiopiaTime } from '@/lib/report';

export const dynamic = 'force-dynamic';

export default async function CheckinsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);
  const p_projectId = str(sp.projectId);
  const p_moduleId = str(sp.moduleId);
  const p_testerId = str(sp.testerId);
  const p_date = str(sp.date);
  const p_hasBlocker = str(sp.hasBlocker);

  // Build the Prisma where clause dynamically based on filters
  const whereClause: Prisma.CheckInWhereInput = {};

  if (p_projectId) whereClause.projectId = p_projectId;
  if (p_moduleId) whereClause.moduleId = p_moduleId;
  if (p_testerId) whereClause.testerId = p_testerId;
  if (p_date) whereClause.ethiopiaDate = p_date;
  if (p_hasBlocker === 'true') whereClause.hasBlocker = true;
  if (p_hasBlocker === 'false') whereClause.hasBlocker = false;

  // Fetch filtered check-ins
  const checkIns = await prisma.checkIn.findMany({
    where: whereClause,
    include: {
      tester: true,
      project: true,
      module: true,
      blockers: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Fetch dropdown data for filters
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const modules = await prisma.module.findMany({ select: { id: true, name: true, project: { select: { name: true } } } });
  const testers = await prisma.tester.findMany({ select: { id: true, fullName: true } });

  return (
    <div className={styles.container}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Daily Check-ins</h1>
          <p className="page-subtitle">{checkIns.length} standup{checkIns.length === 1 ? '' : 's'} submitted via Telegram. Export per-project reports from a project&apos;s Export Report tab.</p>
        </div>
      </header>

      {/* Client-side filtering component */}
      <Filters projects={projects} modules={modules} testers={testers} />

      <div className={styles.tableContainer}>
        {checkIns.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No check-ins found matching these filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tester</th>
                <th>Project & Module</th>
                <th>Work Summary</th>
                <th>Achievement & Plan</th>
                <th>Execution Metrics</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((ci) => (
                <tr key={ci.id}>
                  <td>
                    {ci.ethiopiaDate}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {formatEthiopiaTime(ci.date)}
                    </div>
                  </td>
                  <td>{ci.tester.fullName}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ci.project.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ci.module?.name || 'Full Project'}</div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>{ci.workCompleted}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Achievement:</span>
                      {ci.achievement}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Next Plan:</span>
                      {ci.nextPlan}
                    </div>
                  </td>
                  <td>
                    <div className={styles.numbersGrid}>
                      <div className={styles.numberStat}>
                        <span>Executed</span>
                        {ci.testsExecuted}
                      </div>
                      <div className={styles.numberStat}>
                        <span>Passed</span>
                        <span style={{ color: '#86efac' }}>{ci.testsPassed}</span>
                      </div>
                      <div className={styles.numberStat}>
                        <span>Failed</span>
                        <span style={{ color: '#fca5a5' }}>{ci.testsFailed}</span>
                      </div>
                      <div className={styles.numberStat}>
                        <span>Blocked</span>
                        <span style={{ color: '#fcd34d' }}>{ci.testsBlocked}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {ci.hasBlocker ? (
                      <>
                        <span className={`${styles.badge} ${styles.badgeDanger}`}>Blocked</span>
                        <div className={styles.blockerText}>
                          {ci.blockerDescription}
                        </div>
                      </>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
