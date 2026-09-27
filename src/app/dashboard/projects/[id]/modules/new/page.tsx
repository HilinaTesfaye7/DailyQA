import ModuleForm from '@/app/dashboard/projects/ModuleForm';
import { prisma } from '@/lib/db';

export default async function NewModulePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const projectId = (await params).id;
  const sParams = await searchParams;
  const subProjectId = typeof sParams.subProjectId === 'string' ? sParams.subProjectId : null;
  const testers = await prisma.tester.findMany({ where: { status: 'ACTIVE' }});

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Create Module</h1>
      <ModuleForm projectId={projectId} subProjectId={subProjectId} testers={testers} />
    </div>
  );
}
