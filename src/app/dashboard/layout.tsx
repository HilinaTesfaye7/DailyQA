import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Navigation from './Navigation';
import TopHeader from './TopHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const [openBlockers, pendingTesters] = await Promise.all([
    prisma.blocker.count({ where: { status: 'OPEN' } }),
    prisma.tester.count({ where: { status: 'PENDING_ASSIGNMENT' } }),
  ]);

  return (
    <div className="layout-wrapper">
      <Navigation username={session.username} openBlockers={openBlockers} pendingTesters={pendingTesters} />

      <div className="main-content">
        <TopHeader username={session.username} openBlockers={openBlockers} />

        <main className="page-main">
          {children}
        </main>
      </div>
    </div>
  );
}
