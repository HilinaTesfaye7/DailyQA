import SubProjectForm from '@/app/dashboard/projects/SubProjectForm';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function EditSubProjectPage({ params }: { params: Promise<{ id: string, subId: string }> }) {
  const { id: projectId, subId } = await params;
  
  const subProject = await prisma.subProject.findUnique({
    where: { id: subId }
  });

  if (!subProject) notFound();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Edit Sub-project</h1>
      <SubProjectForm projectId={projectId} initialData={subProject} />
    </div>
  );
}
