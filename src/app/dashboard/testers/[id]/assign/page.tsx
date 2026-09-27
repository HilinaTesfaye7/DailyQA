import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import AssignForm from './AssignForm';

export const dynamic = 'force-dynamic';

export default async function AssignTesterPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  
  const tester = await prisma.tester.findUnique({
    where: { id }
  });

  if (!tester) notFound();

  // Fetch all active projects with their complete hierarchy
  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    include: {
      subProjects: {
        include: { modules: true }
      },
      modules: {
        where: { subProjectId: null } // Direct modules
      }
    }
  });

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        Assign Tester: <span style={{ color: 'var(--primary)' }}>{tester.fullName}</span>
      </h1>
      <AssignForm testerId={tester.id} projects={projects} />
    </div>
  );
}
