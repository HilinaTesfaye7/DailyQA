import SubProjectForm from '@/app/dashboard/projects/SubProjectForm';

export default async function NewSubProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const projectId = (await params).id;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Create Sub-project</h1>
      <SubProjectForm projectId={projectId} />
    </div>
  );
}
