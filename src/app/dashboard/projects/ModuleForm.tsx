'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ModuleForm({ projectId, subProjectId = null, initialData = null, testers = [] }: { projectId: string, subProjectId?: string | null, initialData?: any, testers?: any[] }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialData?.name || '');
  const [testerId, setTesterId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isEditing ? `/api/modules/${initialData.id}` : '/api/modules';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, projectId, subProjectId, testerId }),
      });

      if (res.ok) {
        router.push(`/dashboard/projects/${projectId}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save module');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Module Name *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Assign Tester (Optional)</label>
        <select 
          className="input" 
          value={testerId} 
          onChange={(e) => setTesterId(e.target.value)}
          style={{ width: '100%', appearance: 'none' }}
        >
          <option value="">-- Unassigned --</option>
          {testers.map(t => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => router.back()} className="btn" style={{ background: 'var(--border)' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Module'}
        </button>
      </div>
    </form>
  );
}
