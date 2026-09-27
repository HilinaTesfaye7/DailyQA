'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="btn" style={{ background: 'var(--border)', color: 'var(--text)' }}>
      Logout
    </button>
  );
}
