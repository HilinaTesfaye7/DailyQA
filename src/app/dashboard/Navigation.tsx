'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { label: string; path: string; icon: string; addPath?: string; badge?: number; badgeTone?: 'danger' | 'warning' };

export default function Navigation({ username, openBlockers, pendingTesters }: { username: string; openBlockers: number; pendingTesters: number }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '▦' },
        { label: 'Projects', path: '/dashboard/projects', icon: '📁', addPath: '/dashboard/projects/new' },
        { label: 'Team', path: '/dashboard/testers', icon: '👥', badge: pendingTesters, badgeTone: 'warning' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Daily Check-ins', path: '/dashboard/checkins', icon: '🗓' },
        { label: 'Blockers', path: '/dashboard/blockers', icon: '⚠️', badge: openBlockers, badgeTone: 'danger' },
      ],
    },
  ];

  const initials = username.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-main)',
          padding: '0.5rem 0.65rem',
          borderRadius: '8px',
          display: 'none',
          cursor: 'pointer',
        }}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        ☰
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 45,
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
          }}>
            🛡️
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>QA Command Center</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quality, at a glance</span>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sections.map(section => (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <div className="nav-section">{section.title}</div>
                {section.items.map(item => {
                  const isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path);
                  return (
                    <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link href={item.path} onClick={() => setIsOpen(false)} className={`nav-link ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined}>
                        <span style={{ width: '1.1rem', textAlign: 'center' }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {!!item.badge && (
                          <span className={`badge ${item.badgeTone === 'danger' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '0 0.45rem' }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      {item.addPath && (
                        <Link href={item.addPath} onClick={() => setIsOpen(false)} title={`New ${item.label.slice(0, -1)}`} aria-label={`New ${item.label.slice(0, -1)}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--bg-hover)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border-subtle)',
                        }}>+</Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Telegram Status */}
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
          <div style={{
            background: 'var(--bg-body)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Telegram standups</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Tester check-ins submitted via the bot sync here automatically.
            </p>
          </div>
        </div>

        {/* Profile & Logout Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div className="avatar" style={{ width: '36px', height: '36px' }}>{initials}</div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.5px' }}>QA LEAD</span>
            </div>
          </div>

          <button
            onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => { window.location.href = '/'; })}
            className="btn btn-danger-outline btn-sm"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
