import CreateProjectWizard from './CreateProjectWizard';
import { prisma } from '@/lib/db';

export default async function NewProjectPage() {
  const testers = await prisma.tester.findMany({ where: { status: 'ACTIVE' } });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <CreateProjectWizard testers={testers} />
    </div>
  );
}
