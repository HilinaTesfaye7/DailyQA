'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ExportReportTab from './ExportReportTab';

export default function ProjectTabsClient({ project, uniqueMembersCount, dailyStandupsCount, isReady, openBlockers, progress, testsExecuted, testsPassed, testsFailed, testsBlocked, availableTesters, moduleMetrics }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('prd');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const handleAddMemberSubmit = async () => {
    setAssignLoading(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerId: selectedTesterId,
          projectId: project.id,
          moduleIds: selectedModuleIds
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setSelectedTesterId('');
        setSelectedModuleIds([]);
        router.refresh();
      } else {
        alert('Failed to assign tester.');
      }
    } catch (e) {
      alert('Error assigning tester.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveMember = async (assignmentId: string, testerId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}?testerId=${testerId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to remove assignment.');
      }
    } catch (e) {
      alert('Error removing assignment.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tabs-container" style={{ gap: '2.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem', display: 'flex', overflowX: 'auto' }}>
        <button className={`tab ${activeTab === 'prd' ? 'active' : ''}`} onClick={() => setActiveTab('prd')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'prd' ? 'var(--primary)' : 'var(--text-muted)' }}>📄 PRD & Specs</button>
        <button className={`tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'design' ? 'var(--primary)' : 'var(--text-muted)' }}>🎨 Design (Figma)</button>
        <button className={`tab ${activeTab === 'testcases' ? 'active' : ''}`} onClick={() => setActiveTab('testcases')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'testcases' ? 'var(--primary)' : 'var(--text-muted)' }}>✅ Test Cases</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-muted)' }}>👥 Members ({uniqueMembersCount})</button>
        <button className={`tab ${activeTab === 'standups' ? 'active' : ''}`} onClick={() => setActiveTab('standups')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'standups' ? 'var(--primary)' : 'var(--text-muted)' }}>⏱ Daily Standups ({dailyStandupsCount})</button>
        <button className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')} style={{ padding: '1rem 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: activeTab === 'export' ? 'var(--primary)' : 'var(--text-muted)' }}>📥 Export Report</button>
      </div>

      {activeTab === 'export' && (
        <ExportReportTab projectId={project.id} projectName={project.name} checkIns={project.checkIns} />
      )}

      {activeTab === 'prd' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{project.name} Functional Specifications</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Requirements baseline & acceptance criteria for QA test planning</p>
            </div>
            {project.prdLink ? (
              <a href={project.prdLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}>
                Open External Document ↗
              </a>
            ) : (
              <Link href={`/dashboard/projects/${project.id}/edit`} className="btn btn-accent">Add PRD Link +</Link>
            )}
          </div>
          
          <div style={{ background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.5rem' }}>
            {project.prdLink ? (
              <p style={{ color: 'var(--text-dark)' }}>The PRD document is linked and ready for review.</p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No PRD specifications provided. Add a PRD link from <Link href={`/dashboard/projects/${project.id}/edit`} style={{ color: 'var(--primary)' }}>Edit Project</Link>.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'design' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '1rem' }}>Figma Design Specifications</h2>
          {project.figmaLink ? (
             <a href={project.figmaLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}>
                Open Figma Design ↗
             </a>
          ) : (
            <div style={{ padding: '3rem', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No Figma design linked for this project.</p>
              <Link href={`/dashboard/projects/${project.id}/edit`} className="btn btn-accent">+ Add Figma Link</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'testcases' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Submitted Test Cases</h2>
             <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Test cases submitted by assigned QA Testers</span>
          </div>

          {!project.testCases || project.testCases.length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
               <p style={{ color: 'var(--text-muted)' }}>No test cases have been submitted yet.</p>
             </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {project.testCases.map((tc: any) => (
                 <div key={tc.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <div style={{ fontWeight: 'bold', color: '#38bdf8' }}>{tc.tester?.fullName || 'Unknown Tester'}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tc.createdAt).toLocaleString()}</div>
                   </div>
                   <div style={{ color: 'var(--text-main)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                     {tc.content.startsWith('http') ? (
                       <a href={tc.content} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{tc.content}</a>
                     ) : (
                       tc.content
                     )}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Assigned Squad Members</h2>
             <button onClick={() => setShowAddModal(true)} className="btn btn-outline" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}>+ Add Members</button>
          </div>
          {uniqueMembersCount === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
               <p style={{ color: 'var(--text-muted)' }}>No testers currently assigned to this project.</p>
             </div>
          ) : (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {Array.from(new Set(project.assignments.map((a:any) => a.testerId))).map((testerId: any) => {
                  const assignment = project.assignments.find((a:any) => a.testerId === testerId);
                  const tester = assignment?.tester;
                  const moduleName = assignment?.module ? assignment.module.name : 'Full Project';
                  return (
                    <div key={testerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                           {tester?.fullName ? tester.fullName.substring(0,2).toUpperCase() : 'T'}
                         </div>
                         <div>
                           <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{tester?.fullName || 'Unknown Tester'}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to: {moduleName}</div>
                         </div>
                       </div>
                       <button onClick={() => handleRemoveMember(assignment.id, testerId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7 }} title="Remove Member">
                         🗑
                       </button>
                    </div>
                  );
                })}
             </div>
          )}

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
              <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Assign New Member</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select Tester *</label>
                  <select className="input" value={selectedTesterId} onChange={(e) => setSelectedTesterId(e.target.value)} required>
                    <option value="">-- Choose a Tester --</option>
                    {availableTesters?.map((t: any) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select Modules (Optional)</label>
                  {project.modules.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No modules available. Will assign to Full Project.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-body)', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                      {project.modules.map((mod: any) => (
                        <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedModuleIds.includes(mod.id)} onChange={(e) => {
                            if (e.target.checked) setSelectedModuleIds([...selectedModuleIds, mod.id]);
                            else setSelectedModuleIds(selectedModuleIds.filter(id => id !== mod.id));
                          }} style={{ width: '1.25rem', height: '1.25rem' }} />
                          <span style={{ color: 'var(--text-main)' }}>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowAddModal(false); setSelectedTesterId(''); setSelectedModuleIds([]); }} className="btn btn-outline" disabled={assignLoading}>Cancel</button>
                  <button onClick={handleAddMemberSubmit} className="btn btn-primary" disabled={!selectedTesterId || assignLoading}>
                    {assignLoading ? 'Assigning...' : 'Assign Member'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'standups' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', overflowX: 'auto' }}>
           <div className="page-header" style={{ marginBottom: '1.5rem' }}>
             <div>
               <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Daily Team Standups & Check-Ins</h2>
               <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Responses submitted via the Telegram bot, newest first</span>
             </div>
             <button onClick={() => setActiveTab('export')} className="btn btn-accent">📥 Export daily / weekly / monthly</button>
           </div>
           
           {project.checkIns.length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
               <p style={{ color: 'var(--text-muted)' }}>No daily standups recorded yet.</p>
             </div>
           ) : (
             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>Team Member Name</th>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>What did you work on today?</th>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>Blocker</th>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>Risk</th>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>Next Plan</th>
                   <th style={{ padding: '1rem', fontWeight: 600 }}>Major Achievement Today</th>
                 </tr>
               </thead>
               <tbody>
                 {project.checkIns.map((ci: any) => {
                   const tester = ci.tester;
                   const timeString = new Date(ci.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                   
                   return (
                     <tr key={ci.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                       <td style={{ padding: '1.5rem 1rem' }}>
                         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem', flexShrink: 0 }}>
                             {tester?.fullName ? tester.fullName.substring(0,1).toUpperCase() : 'T'}
                           </div>
                           <div>
                             <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{tester?.fullName || 'Unknown Tester'}</div>
                             <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                               QA Engineer / Tester • Module: {ci.module?.name || 'Full Project'}
                             </div>
                             <div style={{ marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem' }}>
                               <span>✈️ Telegram</span> <span>{timeString}</span>
                             </div>
                           </div>
                         </div>
                       </td>
                       <td style={{ padding: '1.5rem 1rem', fontSize: '0.875rem', color: 'var(--text-main)', maxWidth: '200px' }}>
                         {ci.workCompleted}
                       </td>
                       <td style={{ padding: '1.5rem 1rem' }}>
                         {ci.hasBlocker ? (
                           <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', maxWidth: '200px' }}>
                             <span>⚠️</span>
                             <span>{ci.blockerDescription}</span>
                           </div>
                         ) : (
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                             <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> None
                           </span>
                         )}
                       </td>
                       <td style={{ padding: '1.5rem 1rem', fontSize: '0.875rem', color: ci.hasBlocker ? '#f59e0b' : 'var(--text-muted)' }}>
                         {ci.hasBlocker ? (
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                             ⚠️ Medium Risk
                           </span>
                         ) : 'None'}
                       </td>
                       <td style={{ padding: '1.5rem 1rem', fontSize: '0.875rem', color: 'var(--text-main)', maxWidth: '150px' }}>
                         {ci.nextPlan}
                       </td>
                       <td style={{ padding: '1.5rem 1rem', fontSize: '0.875rem', color: '#38bdf8', maxWidth: '150px' }}>
                         {ci.achievement || 'None'}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           )}
        </div>
      )}

      {/* Release Readiness Component */}
      <div className="card" style={{ background: isReady ? 'var(--success-bg)' : openBlockers > 0 ? 'var(--danger-bg)' : 'var(--bg-card)', borderColor: isReady ? 'var(--success-border)' : openBlockers > 0 ? 'var(--danger-border)' : 'var(--border-subtle)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚀 Release Readiness
          </h2>
          <span className={isReady ? "badge badge-success" : "badge badge-danger"}>
            {isReady ? '✅ READY FOR RELEASE' : '❌ NOT READY'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{progress}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Testing Progress</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{testsExecuted}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Executed Tests</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: '8px', border: '1px solid var(--success-border)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{testsPassed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase' }}>Passed</div>
          </div>
          <div style={{ padding: '1rem', background: testsFailed > 0 ? 'var(--danger-bg)' : 'var(--bg-card)', borderRadius: '8px', border: testsFailed > 0 ? '1px solid var(--danger-border)' : '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: testsFailed > 0 ? 'var(--danger)' : 'inherit' }}>{testsFailed}</div>
            <div style={{ fontSize: '0.75rem', color: testsFailed > 0 ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase' }}>Failed</div>
          </div>
          <div style={{ padding: '1rem', background: openBlockers > 0 ? 'var(--warning-bg)' : 'var(--bg-card)', borderRadius: '8px', border: openBlockers > 0 ? '1px solid var(--warning-border)' : '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: openBlockers > 0 ? 'var(--warning)' : 'inherit' }}>{openBlockers}</div>
            <div style={{ fontSize: '0.75rem', color: openBlockers > 0 ? 'var(--warning)' : 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Blockers</div>
          </div>
        </div>
        
        {openBlockers > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.875rem' }}>
            ⚠️ There are {openBlockers} active critical blockers preventing this project from being ready. Please check the Blockers dashboard to resolve them.
          </div>
        )}
        {!isReady && openBlockers === 0 && testsExecuted > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '8px', color: 'var(--warning)', fontSize: '0.875rem' }}>
            ⚠️ Project is not ready. You have {testsFailed} failed tests and {testsBlocked} blocked tests that need to be addressed.
          </div>
        )}
      </div>

      {/* Project Modules */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Project Architecture</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href={`/dashboard/projects/${project.id}/modules/new`} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
              + Add Module
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {project.modules.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No modules mapped yet.</p>
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              <ul style={{ listStyle: 'none', padding: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.modules.map((mod: any) => {
                  const assignedTesters = project.assignments
                    .filter((a: any) => a.moduleId === mod.id)
                    .map((a: any) => a.tester)
                    .filter(Boolean);
                    
                  const metrics = moduleMetrics?.[mod.id] || { testsExecuted: 0, testsPassed: 0, testsFailed: 0, testsBlocked: 0, openBlockers: 0, progress: 0, isReady: false };

                  return (
                    <li key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>🧩 {mod.name}</span>
                          {metrics.testsExecuted > 0 && (
                            <span className={metrics.isReady ? "badge badge-success" : "badge badge-danger"} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                              {metrics.isReady ? 'READY' : 'NOT READY'}
                            </span>
                          )}
                        </div>
                        <Link href={`/dashboard/projects/${project.id}/modules/${mod.id}/edit`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          Edit
                        </Link>
                      </div>
                      
                      {/* Module Metrics Grid */}
                      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-subtle)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.progress}%</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progress</div>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-subtle)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.totalTests}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planned</div>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-subtle)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.testsExecuted}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Executed</div>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{metrics.testsPassed}</div>
                          <div style={{ fontSize: '0.6rem', color: '#10b981', textTransform: 'uppercase' }}>Passed</div>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: metrics.testsFailed > 0 ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-body)', borderRadius: '6px', border: metrics.testsFailed > 0 ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid var(--border-subtle)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.testsFailed > 0 ? '#f43f5e' : 'inherit' }}>{metrics.testsFailed}</div>
                          <div style={{ fontSize: '0.6rem', color: metrics.testsFailed > 0 ? '#f43f5e' : 'var(--text-muted)', textTransform: 'uppercase' }}>Failed</div>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: metrics.openBlockers > 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-body)', borderRadius: '6px', border: metrics.openBlockers > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--border-subtle)', minWidth: '100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.openBlockers > 0 ? '#f59e0b' : 'inherit' }}>{metrics.openBlockers}</div>
                          <div style={{ fontSize: '0.6rem', color: metrics.openBlockers > 0 ? '#f59e0b' : 'var(--text-muted)', textTransform: 'uppercase' }}>Blockers</div>
                        </div>
                      </div>
                      
                      {assignedTesters.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>Assigned Testers:</span>
                          {assignedTesters.map((t: any) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#38bdf8', color: 'black', fontSize: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {t.fullName.charAt(0)}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{t.fullName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
