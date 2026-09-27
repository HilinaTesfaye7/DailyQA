'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProjectWizard({ testers }: { testers: any[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    deadline: '',
    stagingUrl: '',
    productOwner: '',
    prdLink: '',
    figmaLink: '',
  });

  const [modules, setModules] = useState([{ id: 1, name: '' }]);
  const [testerAssignments, setTesterAssignments] = useState<Record<string, number[]>>({});

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddModule = () => {
    setModules([...modules, { id: Date.now(), name: '' }]);
  };

  const handleModuleChange = (id: number, value: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, name: value } : m));
  };

  const toggleTester = (testerId: string) => {
    setTesterAssignments(prev => {
      const next = { ...prev };
      if (testerId in next) delete next[testerId];
      else next[testerId] = [];
      return next;
    });
  };

  const toggleModuleForTester = (e: React.ChangeEvent<HTMLInputElement>, testerId: string, moduleId: number) => {
    e.stopPropagation(); // prevent triggering toggleTester
    setTesterAssignments(prev => {
      const next = { ...prev };
      const current = next[testerId] || [];
      if (current.includes(moduleId)) {
        next[testerId] = current.filter(id => id !== moduleId);
      } else {
        next[testerId] = [...current, moduleId];
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Project
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!projRes.ok) throw new Error('Failed to create project');
      const { project } = await projRes.json();

      // 2. Create Modules
      const createdModules: { tempId: number, realId: string }[] = [];
      for (const mod of modules) {
        if (mod.name.trim()) {
          const mRes = await fetch('/api/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: mod.name, projectId: project.id })
          });
          const mData = await mRes.json();
          if (mData.module) {
            createdModules.push({ tempId: mod.id, realId: mData.module.id });
          }
        }
      }

      // 3. Assign Testers to Project
      for (const tId of Object.keys(testerAssignments)) {
        const assignedTempIds = testerAssignments[tId];
        const realModuleIds = assignedTempIds
            .map(tempId => createdModules.find(cm => cm.tempId === tempId)?.realId)
            .filter(Boolean);
            
        await fetch('/api/assignments', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             testerId: tId, 
             projectId: project.id,
             moduleIds: realModuleIds.length > 0 ? realModuleIds : undefined 
           })
        });
      }

      router.push(`/dashboard/projects/${project.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ width: '800px', maxWidth: '95vw', background: '#0B1120', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#38bdf8', color: '#0B1120', padding: '0.5rem', borderRadius: '8px' }}>
            📁
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Create QA Project & Allocate Squad</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Portal Administrator • Add PRD, Design, and automatically notify assigned QA members</p>
          </div>
        </div>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      </div>

      {/* Tabs / Steps */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 2rem', gap: '2rem', overflowX: 'auto' }}>
        {[
          { num: 1, label: 'Project Essentials', icon: '📁' },
          { num: 2, label: 'PRD & Specs', icon: '📄' },
          { num: 3, label: 'Design (Figma)', icon: '🎨' },
          { num: 4, label: 'Modules', icon: '🧩' },
          { num: 5, label: 'Members & Notification', icon: '👥' }
        ].map(t => (
          <div key={t.num} onClick={() => setStep(t.num)} style={{ 
            padding: '1rem 0', 
            color: step === t.num ? '#38bdf8' : 'var(--text-muted)', 
            borderBottom: step === t.num ? '2px solid #38bdf8' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{t.num}. {t.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '2rem', minHeight: '400px' }}>
        {error && <div style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Main Project *</label>
                <input name="name" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.name} onChange={handleChange} required placeholder="e.g. wise" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Short Code / Prefix</label>
                <input className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} placeholder="E.G. NMB" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>QA Scope & Description</label>
              <textarea name="description" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', minHeight: '100px' }} value={formData.description} onChange={handleChange} placeholder="Describe the QA testing scope, key target platforms, and high-level milestones..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Initial Project Status</label>
                <select name="status" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }} value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE" style={{ color: 'black' }}>Active Testing</option>
                  <option value="BLOCKED" style={{ color: 'black' }}>Blocked</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Target Release Date</label>
                <input type="date" name="deadline" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.deadline} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Staging / Test Environment URL</label>
                <input name="stagingUrl" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.stagingUrl} onChange={handleChange} placeholder="https://staging-app.internal" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Product Owner / Stakeholder</label>
                <input name="productOwner" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.productOwner} onChange={handleChange} placeholder="David Chen (VP Product)" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>PRD Document URL</label>
              <input name="prdLink" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.prdLink} onChange={handleChange} placeholder="https://docs.google.com/..." />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>The PRD link will be visible to all testers to understand acceptance criteria.</p>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Figma Design Link</label>
              <input name="figmaLink" className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} value={formData.figmaLink} onChange={handleChange} placeholder="https://figma.com/file/..." />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Design link helps testers verify pixel-perfect implementation.</p>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Define the core modules to be tested within this project.</p>
            {modules.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', width: '20px' }}>{i + 1}.</div>
                <input 
                  className="input" 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                  value={m.name} 
                  onChange={(e) => handleModuleChange(m.id, e.target.value)} 
                  placeholder="Module Name (e.g., Authentication, Transfers)"
                />
              </div>
            ))}
            <button onClick={handleAddModule} className="btn" style={{ background: 'transparent', border: '1px dashed var(--border-subtle)', color: '#38bdf8', padding: '0.75rem' }}>+ Add Another Module</button>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select testers to assign to this project. They will be notified via Telegram.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {testers.map(t => {
                const isSelected = t.id in testerAssignments;
                const assignedModules = testerAssignments[t.id] || [];
                const validModules = modules.filter(m => m.name.trim() !== '');

                return (
                  <div 
                    key={t.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      padding: '1rem', 
                      background: isSelected ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.03)', 
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px'
                    }}
                  >
                    <div onClick={() => toggleTester(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#38bdf8' : 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'black' : 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {isSelected ? '✓' : t.fullName.charAt(0)}
                      </div>
                      <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>{t.fullName}</div>
                    </div>

                    {isSelected && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assign to modules (Optional):</div>
                        {validModules.length > 0 ? (
                          validModules.map(m => (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'white' }}>
                              <input 
                                type="checkbox" 
                                checked={assignedModules.includes(m.id)} 
                                onChange={(e) => toggleModuleForTester(e, t.id, m.id)} 
                              />
                              {m.name}
                            </label>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No modules defined in Step 4. Assigned to Full Project.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {testers.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                No active testers found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-subtle)', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}>Cancel</button>
        {step > 1 && (
          <button onClick={handlePrev} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>← Previous</button>
        )}
        {step < 5 ? (
          <button onClick={handleNext} className="btn btn-primary" style={{ background: '#38bdf8', color: '#0B1120' }}>Next: {step === 1 ? 'PRD & Specs' : step === 2 ? 'Design' : step === 3 ? 'Modules' : 'Members'} →</button>
        ) : (
          <button onClick={handleSubmit} className="btn btn-primary" style={{ background: '#10b981', color: 'white' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Project & Assign Testers'}
          </button>
        )}
      </div>
    </div>
  );
}
