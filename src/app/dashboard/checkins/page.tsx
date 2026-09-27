import { prisma } from '@/lib/db';
import styles from './page.module.css';
import Filters from './Filters';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CheckinsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const p_projectId = searchParams.projectId as string | undefined;
  const p_moduleId = searchParams.moduleId as string | undefined;
  const p_testerId = searchParams.testerId as string | undefined;
  const p_date = searchParams.date as string | undefined;
  const p_hasBlocker = searchParams.hasBlocker as string | undefined;

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
      <header className={styles.header}>
        <h1>QA Daily Check-ins</h1>
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
                      {new Date(ci.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>{ci.tester.fullName}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ci.project.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ci.module.name}</div>
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
