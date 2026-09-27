import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RemoveAssignmentButton from './RemoveAssignmentButton';

export const dynamic = 'force-dynamic';

export default async function TesterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const tester = await prisma.tester.findUnique({
    where: { id },
    include: {
      assignments: {
        include: {
          project: true,
          subProject: true,
          module: true
        },
        orderBy: { assignedAt: 'desc' }
      }
    }
  });

  if (!tester) notFound();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <Link href="/dashboard/testers" style={{ color: 'var(--text-muted)' }}>← Back to Testers</Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginLeft: '1rem' }}>{tester.fullName}</h1>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: tester.status === 'ACTIVE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(250, 204, 21, 0.2)',
          color: tester.status === 'ACTIVE' ? '#60a5fa' : '#facc15'
        }}>
          {tester.status.replace('_', ' ')}
        </span>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tester Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Telegram ID</span>
            <p style={{ fontWeight: 500 }}>{tester.telegramId}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Registration Date</span>
            <p style={{ fontWeight: 500 }}>{new Date(tester.registrationDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Active Assignments</h2>
        <Link href={`/dashboard/testers/${tester.id}/assign`} className="btn btn-primary">
          + Assign to Project
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {tester.assignments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>This tester has no active assignments.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Project</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sub-project</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Module</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tester.assignments.map(assignment => (
                <tr key={assignment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{assignment.project.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{assignment.subProject?.name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{assignment.module?.name || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <RemoveAssignmentButton assignmentId={assignment.id} testerId={tester.id} />
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
