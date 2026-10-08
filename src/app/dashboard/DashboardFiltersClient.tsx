'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardFiltersClient({ projects, activeProjectsCount }: { projects: { id: string; name: string }[], activeProjectsCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProjectId = searchParams.get('projectId') || 'all';
  const currentTimeframe = searchParams.get('timeframe') || 'daily';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        className="input"
        aria-label="Filter by project"
        style={{ width: 'auto', minWidth: '200px', background: 'var(--bg-card)', cursor: 'pointer' }}
        value={currentProjectId}
        onChange={e => setParam('projectId', e.target.value)}
      >
        <option value="all">All projects ({activeProjectsCount} active)</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="segmented" role="group" aria-label="Timeframe">
        {[
          { value: 'daily', label: 'Today' },
          { value: 'weekly', label: 'Week' },
          { value: 'monthly', label: 'Month' },
          { value: 'yearly', label: 'Year' },
        ].map(t => (
          <button key={t.value} className={currentTimeframe === t.value ? 'active' : ''} onClick={() => setParam('timeframe', t.value)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
