'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export default function Filters({ projects, modules, testers }: { projects: any[], modules: any[], testers: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [moduleId, setModuleId] = useState(searchParams.get('moduleId') || '');
  const [testerId, setTesterId] = useState(searchParams.get('testerId') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'OPEN');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (moduleId) params.set('moduleId', moduleId);
    if (testerId) params.set('testerId', testerId);
    if (status) params.set('status', status);

    router.push(`/dashboard/blockers?${params.toString()}`);
  };

  const handleReset = () => {
    setProjectId('');
    setModuleId('');
    setTesterId('');
    setStatus('OPEN');
    router.push('/dashboard/blockers?status=OPEN');
  };

  return (
    <div className={styles.filtersCard}>
      <div className={styles.filterGroup}>
        <label>Status</label>
        <select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Tester</label>
        <select className={styles.select} value={testerId} onChange={e => setTesterId(e.target.value)}>
          <option value="">All Testers</option>
          {testers.map(t => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Project</label>
        <select className={styles.select} value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Module</label>
        <select className={styles.select} value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.project?.name})</option>
          ))}
        </select>
      </div>

      <button className={styles.button} onClick={handleFilter}>Apply Filters</button>
      <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleReset}>Reset</button>
    </div>
  );
}
