'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TopHeader() {
  const pathname = usePathname();
  
  if (pathname === '/dashboard') {
    return null;
  }

  // Derive title from pathname
  const segments = pathname.split('/').filter(Boolean);
  const title = segments.length > 1 ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Overview';

  return (
    <header className="desktop-header-padding" style={{
      height: '70px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      background: 'var(--bg-body)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
        <span>Workspace</span>
        <span>›</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{title}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }}>🔍</span>
          <input type="text" placeholder="Search anything... ⌘K" className="input" style={{ paddingLeft: '2.2rem', width: '250px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-muted)' }}>
            🔔
            <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>11</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem' }}>👩‍💻</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Sarah (Lead A)</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>QA Lead</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
