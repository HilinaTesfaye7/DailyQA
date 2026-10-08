'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProject } from '@/app/actions/projectActions';

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${projectName}"? This permanently deletes all modules, assignments, standups and test history.`)) return;
    setLoading(true);
    try {
      await deleteProject(projectId);
      router.push('/dashboard/projects');
    } catch {
      alert('Failed to delete project.');
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="btn btn-danger-outline">
      {loading ? 'Deleting…' : '🗑 Delete Project'}
    </button>
  );
}
