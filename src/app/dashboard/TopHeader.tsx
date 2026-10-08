'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const SECTION_TITLES: Record<string, string> = {
  projects: 'Projects',
  testers: 'Team',
  checkins: 'Daily Check-ins',
  blockers: 'Blockers',
};

export default function TopHeader({ username, openBlockers }: { username: string; openBlockers: number }) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const section = segments[1];
  const sectionTitle = section ? SECTION_TITLES[section] || section.charAt(0).toUpperCase() + section.slice(1) : 'Dashboard';
  const isDetail = segments.length > 2;

  return (
    <header className="desktop-header-padding" style={{
      height: '64px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0 2rem',
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, minWidth: 0 }}>
        <Link href="/dashboard">Workspace</Link>
        <span>›</span>
        {isDetail ? (
          <>
            <Link href={`/${segments[0]}/${section}`}>{sectionTitle}</Link>
            <span>›</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Details</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{sectionTitle}</span>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link
          href="/dashboard/blockers"
          title={openBlockers > 0 ? `${openBlockers} open blockers` : 'No open blockers'}
          aria-label={`${openBlockers} open blockers`}
          style={{ position: 'relative', color: 'var(--text-muted)', fontSize: '1.05rem' }}
        >
          🔔
          {openBlockers > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--danger)', minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '999px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {openBlockers > 99 ? '99+' : openBlockers}
            </span>
          )}
        </Link>
        <div className="header-search" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div className="avatar">{username.substring(0, 2).toUpperCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{username}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>QA Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
}
