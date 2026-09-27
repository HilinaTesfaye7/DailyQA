import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProjectForm from '../../ProjectForm';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Edit Project</h1>
      <ProjectForm initialData={project} />
    </div>
  );
}
