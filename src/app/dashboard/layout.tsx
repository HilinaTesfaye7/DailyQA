import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Navigation from './Navigation';
import TopHeader from './TopHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/');
  }

  return (
    <div className="layout-wrapper">
      <Navigation />
      
      <div className="main-content">
        <TopHeader />
        
        <main style={{ flex: 1, padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
