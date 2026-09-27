import ModuleForm from '@/app/dashboard/projects/ModuleForm';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function EditModulePage({ params }: { params: Promise<{ id: string, modId: string }> }) {
  const { id: projectId, modId } = await params;
  
  const mod = await prisma.module.findUnique({
    where: { id: modId }
  });

  if (!mod) notFound();

  const testers = await prisma.tester.findMany({
    orderBy: { fullName: 'asc' }
  });

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Edit Module</h1>
      <ModuleForm projectId={projectId} subProjectId={mod.subProjectId} initialData={mod} testers={testers} />
    </div>
  );
}
