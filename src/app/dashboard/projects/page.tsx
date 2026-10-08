import { prisma } from '@/lib/db';
import Link from 'next/link';
import ProjectsTableClient from './ProjectsTableClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsListPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignments: {
        include: { tester: true }
      },
      checkIns: {
        orderBy: { ethiopiaDate: 'desc' },
        include: {
          tester: true,
          blockers: true
        }
      }
    }
  });

  const ethiopiaToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Authorized Projects</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Projects you have explicit authorization and role membership in</p>
          </div>
          <Link href="/dashboard/projects/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            + New Project
          </Link>
        </div>

        <ProjectsTableClient projects={projects} ethiopiaToday={ethiopiaToday} />
      </div>
    </div>
  );
}
