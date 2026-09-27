import { prisma } from '@/lib/db';
import styles from './page.module.css';
import Filters from './Filters';
import { resolveBlocker } from './actions';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function BlockersPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const p_projectId = searchParams.projectId as string | undefined;
  const p_moduleId = searchParams.moduleId as string | undefined;
  const p_testerId = searchParams.testerId as string | undefined;
  const p_status = (searchParams.status as string) || 'OPEN';

  // Build the Prisma where clause dynamically based on filters
  const whereClause: Prisma.BlockerWhereInput = {};

  if (p_status) whereClause.status = p_status;

  if (p_projectId || p_moduleId || p_testerId) {
    whereClause.checkIn = {};
    if (p_projectId) whereClause.checkIn.projectId = p_projectId;
    if (p_moduleId) whereClause.checkIn.moduleId = p_moduleId;
    if (p_testerId) whereClause.checkIn.testerId = p_testerId;
  }

  // Fetch filtered blockers
  const blockers = await prisma.blocker.findMany({
    where: whereClause,
    include: {
      checkIn: {
        include: {
          tester: true,
          project: true,
          module: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Fetch dropdown data for filters
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const modules = await prisma.module.findMany({ select: { id: true, name: true, project: { select: { name: true } } } });
  const testers = await prisma.tester.findMany({ select: { id: true, fullName: true } });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Blocker Management</h1>
      </header>

      {/* Client-side filtering component */}
      <Filters projects={projects} modules={modules} testers={testers} />

      <div className={styles.tableContainer}>
        {blockers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No blockers found matching these filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reported On</th>
                <th>Tester</th>
                <th>Project & Module</th>
                <th>Blocker Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blockers.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.checkIn.ethiopiaDate}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>{b.checkIn.tester.fullName}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.checkIn.project.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.checkIn.module.name}</div>
                  </td>
                  <td style={{ maxWidth: '400px', color: '#fca5a5' }}>
                    {b.description}
                  </td>
                  <td>
                    {b.status === 'OPEN' ? (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>OPEN</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>RESOLVED</span>
                    )}
                  </td>
                  <td>
                    {b.status === 'OPEN' && (
                      <form action={resolveBlocker.bind(null, b.id)}>
                        <button type="submit" className={styles.actionButton}>
                          Resolve
                        </button>
                      </form>
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
