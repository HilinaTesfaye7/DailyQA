'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '㗊' },
    { label: 'Projects', path: '/dashboard/projects', icon: '📁', hasAdd: true },
    { label: 'Team', path: '/dashboard/testers', icon: '👥' },
  ];

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
          padding: '0.5rem',
          borderRadius: '6px',
          display: 'none',
        }}
        aria-label="Toggle Menu"
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
          background: 'var(--bg-body)',
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
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
            }}>
              🛡️
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>QA Command<br/>Center</h2>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>Quality, at a glance</span>
            </div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontSize: '1rem' }}>
            &lt;
          </button>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(item => {
              const isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path);
              return (
                <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link href={item.path} onClick={() => setIsOpen(false)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--primary-bg)' : 'transparent',
                    border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                    fontSize: '0.875rem',
                    flex: 1
                  }}>
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                  {item.hasAdd && (
                    <Link href={`${item.path}/new`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--bg-hover)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border-subtle)',
                      textDecoration: 'none'
                    }}>+</Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Telegram Live Status */}
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Telegram Bot Live</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', lineHeight: 1.4 }}>
              Connected: Coco (tester) daily standups automatically synced
            </p>
          </div>
        </div>

        {/* Profile & Logout Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-border)' }}>
              <span style={{ fontSize: '1rem' }}>👩‍💻</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Sarah (Lead A)</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.5px' }}>QA LEAD</span>
            </div>
          </div>
          
          <button onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href='/')} style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            color: 'var(--danger)',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
