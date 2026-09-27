'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RemoveAssignmentButton({ assignmentId, testerId }: { assignmentId: string, testerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}?testerId=${testerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to remove assignment');
        setLoading(false);
      }
    } catch (err) {
      alert('An error occurred');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRemove} 
      disabled={loading}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        color: 'var(--error)', 
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        opacity: loading ? 0.5 : 1
      }}
    >
      {loading ? 'Removing...' : 'Remove'}
    </button>
  );
}
