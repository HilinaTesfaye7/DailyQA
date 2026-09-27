'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteTesterButton({ testerId }: { testerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to completely delete this QA member? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/testers/${testerId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete tester.');
      }
    } catch (e) {
      alert('An error occurred while deleting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-danger-outline" 
      style={{ padding: '0.25rem 0.5rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
      title="Delete Tester"
    >
      {loading ? '...' : '🗑'}
    </button>
  );
}
