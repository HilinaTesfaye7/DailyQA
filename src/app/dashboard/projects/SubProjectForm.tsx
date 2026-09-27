'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubProjectForm({ projectId, initialData = null }: { projectId: string, initialData?: any }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialData?.name || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isEditing ? `/api/subprojects/${initialData.id}` : '/api/subprojects';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, projectId }),
      });

      if (res.ok) {
        router.push(`/dashboard/projects/${projectId}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save sub-project');
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
      
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sub-project Name *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => router.back()} className="btn" style={{ background: 'var(--border)' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Sub-project'}
        </button>
      </div>
    </form>
  );
}
