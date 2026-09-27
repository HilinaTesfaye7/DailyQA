'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardFiltersClient({ projects, activeProjectsCount }: { projects: any[], activeProjectsCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentProjectId = searchParams.get('projectId') || 'all';
  const currentTimeframe = searchParams.get('timeframe') || 'daily';

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('projectId', e.target.value);
    router.push(`?${params.toString()}`);
  };

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('timeframe', e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <select 
        className="input" 
        style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', appearance: 'auto', cursor: 'pointer' }}
        value={currentProjectId}
        onChange={handleProjectChange}
      >
        <option value="all">All Active Projects ({activeProjectsCount})</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select 
        className="input" 
        style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', appearance: 'auto', cursor: 'pointer' }}
        value={currentTimeframe}
        onChange={handleTimeframeChange}
      >
        <option value="daily">Today</option>
        <option value="weekly">This Week</option>
        <option value="yearly">This Year</option>
      </select>
    </div>
  );
}
