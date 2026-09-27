'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateProjectStatus, deleteProject } from '@/app/actions/projectActions';

export default function ProjectsTableClient({ projects, ethiopiaToday }: { projects: any[], ethiopiaToday: string }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(project => {
    // Status Filter
    if (filter === 'IN PROGRESS' && project.status !== 'IN PROGRESS' && project.status !== 'ACTIVE') return false;
    if (filter === 'READY FOR RELEASE' && project.status !== 'READY FOR RELEASE') return false;
    if (filter === 'BLOCKED' && project.status !== 'BLOCKED') return false;
    if (filter === 'COMPLETED' && project.status !== 'COMPLETED') return false;
    
    // Search
    if (search && !project.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    await updateProjectStatus(projectId, newStatus);
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This will permanently delete all modules, assignments, and test history.')) {
      await deleteProject(projectId);
    }
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', background: 'var(--bg-body)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {['ALL', 'IN PROGRESS', 'READY FOR RELEASE', 'BLOCKED', 'COMPLETED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className="btn" 
              style={
                filter === f 
                ? { background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(56,189,248,0.2)' }
                : { color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.4rem 1rem', fontWeight: 600 }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input" 
              style={{ width: '250px', paddingLeft: '2.2rem', background: 'var(--bg-body)' }} 
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-body)', borderRadius: '6px', padding: '0.25rem', border: '1px solid var(--border-subtle)' }}>
            <button className="btn" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}># Table</button>
            <button className="btn" style={{ color: 'var(--text-muted)', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>⊞ Grid</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.75rem' }}>
              <th style={{ padding: '1rem', fontWeight: 500, width: '20%' }}>Project</th>
              <th style={{ padding: '1rem', fontWeight: 500, width: '15%' }}>Project Status</th>
              <th style={{ padding: '1rem', fontWeight: 500, width: '15%' }}>Delivery Progress</th>
              <th style={{ padding: '1rem', fontWeight: 500, width: '10%' }}>Members</th>
              <th style={{ padding: '1rem', fontWeight: 500, width: '25%' }}>Daily Standup Update</th>
              <th style={{ padding: '1rem', fontWeight: 500, width: '15%', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No projects found.</td>
              </tr>
            )}
            {filteredProjects.map(project => {
              let totalTests = 0;
              project.assignments.forEach((a: any) => {
                totalTests += a.totalTests || 0;
              });

              const latestCheckInsMap = new Map<string, any>();
              project.checkIns.forEach((ci: any) => {
                const key = `${ci.testerId}-${ci.moduleId || 'FULL_PROJECT'}`;
                if (!latestCheckInsMap.has(key)) {
                  latestCheckInsMap.set(key, ci);
                } else {
                  const existing = latestCheckInsMap.get(key);
                  if (new Date(ci.date).getTime() > new Date(existing.date).getTime()) {
                    latestCheckInsMap.set(key, ci);
                  }
                }
              });

              let testsPassed = 0;
              Array.from(latestCheckInsMap.values()).forEach(ci => {
                testsPassed += ci.testsPassed;
              });

              let hasActiveBlocker = false;
              project.checkIns.forEach((ci: any) => {
                if (ci.blockers.some((b: any) => b.status === 'OPEN')) {
                  hasActiveBlocker = true;
                }
              });

              const progress = totalTests > 0 ? Math.min(100, Math.round((testsPassed / totalTests) * 100)) : 0;
              const isReady = totalTests > 0 && testsPassed >= totalTests && !hasActiveBlocker;
              
              // Automatically set styling based on real readiness, but keep dropdown functional
              const uniqueMembers = new Set(project.assignments.map((a: any) => a.testerId)).size;
              const todaysCheckins = project.checkIns.filter((ci: any) => ci.ethiopiaDate === ethiopiaToday);

              return (
                <tr key={project.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.25rem' }}>{project.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Target: {project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select 
                        value={project.status === 'ACTIVE' ? 'IN PROGRESS' : project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        style={{ 
                          appearance: 'none', 
                          padding: '0.4rem 2rem 0.4rem 0.75rem', 
                          borderRadius: '8px', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          background: hasActiveBlocker || project.status === 'BLOCKED' ? 'rgba(244, 63, 94, 0.1)' : (isReady || project.status === 'READY FOR RELEASE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)'),
                          color: hasActiveBlocker || project.status === 'BLOCKED' ? '#f43f5e' : (isReady || project.status === 'READY FOR RELEASE' ? '#10b981' : '#38bdf8')
                        }}
                      >
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="READY FOR RELEASE">READY FOR RELEASE</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                      <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'currentColor' }}>⌄</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>Delivery<br/>Progress</span>
                      <span style={{ border: '1px solid rgba(56,189,248,0.3)', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#38bdf8', fontWeight: 600 }}>{progress} %</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                    👥 {uniqueMembers}
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    {todaysCheckins.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No standup recorded today</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        {todaysCheckins.slice(0, 1).map((ci: any) => (
                          <div key={ci.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.75rem' }}>{ci.tester.fullName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(tester)</span></span>
                              <span style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                ✈️ Telegram
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-dark)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Today:</span> {ci.workCompleted.length > 20 ? ci.workCompleted.substring(0, 20) + '...' : ci.workCompleted}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {ci.hasBlocker && (
                                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                  ⚠️ Blocker: {ci.blockers.find((b: any) => b.status === 'OPEN')?.description?.substring(0, 10) || 'Yes'}
                                </span>
                              )}
                              {ci.testsFailed > 0 && (
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                  ⚠️ Risk: {ci.testsFailed} Failed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Link href={`/dashboard/projects/${project.id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.05)' }}>
                        ◎ View
                      </Link>
                      <button onClick={() => handleDelete(project.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
