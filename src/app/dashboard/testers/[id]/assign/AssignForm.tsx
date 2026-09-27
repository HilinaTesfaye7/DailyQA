'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AssignForm({ testerId, projects }: { testerId: string, projects: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Available modules are just all modules of the selected project
  const availableModules = selectedProject ? selectedProject.modules : [];

  const handleModuleToggle = (modId: string) => {
    setSelectedModuleIds(prev => 
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Project selection is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerId,
          projectId: selectedProjectId,
          moduleIds: selectedModuleIds
        }),
      });

      if (res.ok) {
        router.push(`/dashboard/testers/${testerId}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign tester');
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
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>1. Select Project *</label>
        <select 
          className="input" 
          value={selectedProjectId} 
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedModuleIds([]);
          }} 
          required
        >
          <option value="">-- Choose a Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProject && (
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            2. Select Modules (Optional)
          </label>
          {availableModules.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No modules available for this project.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
              {availableModules.map((mod: any) => (
                <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedModuleIds.includes(mod.id)}
                    onChange={() => handleModuleToggle(mod.id)}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span>{mod.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => router.back()} className="btn" style={{ background: 'var(--border)' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading || !selectedProjectId}>
          {loading ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </div>
    </form>
  );
}
