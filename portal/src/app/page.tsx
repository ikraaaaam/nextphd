import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { logout } from './login/actions';

export default async function Page() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Should be caught by middleware, but fallback
    return <div>Please log in</div>;
  }

  const { data: opportunitiesData } = await supabase.from('opportunities').select('*,universities(name),professors(name)');
  const { data: universitiesData } = await supabase.from('universities').select('*');
  const { data: professorsData } = await supabase.from('professors').select('*,universities(name)');
  const { data: settingsData } = await supabase.from('settings').select('*');
  const { data: runsData } = await supabase.from('run_log').select('*').order('ran_at', { ascending: false });
  const { data: digestsData } = await supabase.from('digests').select('*').order('day', { ascending: false });
  
  const opportunities = opportunitiesData || [];
  const universities = universitiesData || [];
  const professors = professorsData || [];
  const settings = settingsData || [];
  const runs = runsData || [];
  const digests = digestsData || [];
  
  const profile = settings.length > 0 ? settings[0] : null;

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#111' }}>NEXTPHD Intelligence Portal</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Phase 3/4: Comprehensive Dashboard</p>
        </div>
        <form action={logout}>
          <button style={{ padding: '0.5rem 1rem', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Log Out</button>
        </form>
      </header>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <section style={{ flex: 1 }}>
          <h2>My Profile & Matches</h2>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            {profile ? (
              <>
                <p><strong>Funding Pref:</strong> {profile.preferences?.funding}</p>
                <p><strong>Tech Skills:</strong> {profile.technical_skills?.skills?.join(', ')}</p>
                <p><strong>Research Interests:</strong> {profile.research_background?.interests?.join(', ')}</p>
              </>
            ) : <p>Profile not setup.</p>}
          </div>
        </section>

        <section style={{ flex: 1 }}>
          <h2>Universities ({universities.length})</h2>
          {universities.map((u: any) => (
            <div key={u.id} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
              <h3>{u.name} {u.is_favourite ? '⭐️' : ''}</h3>
              <p>{u.country} • {u.works_count} works</p>
            </div>
          ))}
        </section>
        
        <section style={{ flex: 1 }}>
          <h2>Professors ({professors.length})</h2>
          {professors.map((p: any) => (
            <div key={p.id} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
              <h3>{p.name} {p.is_favourite ? '⭐️' : ''}</h3>
              <p>{p.universities?.name}</p>
              <div style={{ padding: '0.5rem', background: '#e6f2ff', borderRadius: '4px' }}>
                <strong>Match Score: {p.fit_score}%</strong>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>{p.fit_reason}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section style={{ marginTop: '2rem', background: '#fafafa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2>Intelligence Cycle (Phase 10)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <h3>Morning Discovery</h3>
            <p><strong>Last Run:</strong> {runs.find((r:any) => r.segment === 'MORNING_DISCOVERY')?.ran_at ? new Date(runs.find((r:any) => r.segment === 'MORNING_DISCOVERY').ran_at).toLocaleString() : 'Never'}</p>
            <p><strong>Status:</strong> {runs.find((r:any) => r.segment === 'MORNING_DISCOVERY')?.status || 'N/A'}</p>
          </div>
          <div>
            <h3>Afternoon Verification</h3>
            <p><strong>Last Run:</strong> {runs.find((r:any) => r.segment === 'AFTERNOON_VERIFICATION')?.ran_at ? new Date(runs.find((r:any) => r.segment === 'AFTERNOON_VERIFICATION').ran_at).toLocaleString() : 'Never'}</p>
            <p><strong>Status:</strong> {runs.find((r:any) => r.segment === 'AFTERNOON_VERIFICATION')?.status || 'N/A'}</p>
          </div>
          <div>
            <h3>Evening Digest</h3>
            <p><strong>Last Digest:</strong> {digests && digests.length > 0 ? digests[0].day : 'None'}</p>
          </div>
        </div>
        
        {digests && digests.length > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Latest Digest ({digests[0].day})</h3>
            <div dangerouslySetInnerHTML={{ __html: digests[0].summary_md.replace(/\n/g, '<br/>') }} style={{ fontSize: '0.9rem', color: '#444' }} />
          </div>
        )}
      </section>

      <h2 style={{ marginTop: '2rem' }}>Opportunities ({opportunities.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {opportunities.length === 0 ? (
          <p>No opportunities found.</p>
        ) : (
          opportunities.map((opp: any) => (
            <div key={opp.id} style={{ 
              border: '1px solid #eaeaea', 
              borderRadius: '8px', 
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '1.25rem', marginTop: 0 }}>
                <a href={opp.source_url} target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {opp.title}
                </a>
              </h3>
              {opp.universities && <p><strong>Univ:</strong> {opp.universities.name}</p>}
              {opp.professors && <p><strong>Prof:</strong> {opp.professors.name}</p>}
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#555' }}>
                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: '#eee', borderRadius: '4px', marginRight: '0.5rem' }}>
                  {opp.verification}
                </span>
                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: opp.funding_class === 'FULLY_FUNDED' ? '#d4edda' : '#fff3cd', borderRadius: '4px', color: opp.funding_class === 'FULLY_FUNDED' ? '#155724' : '#856404' }}>
                  Funding: {opp.funding_class || 'UNKNOWN'}
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.5 }}>
                {opp.notes ? opp.notes.substring(0, 150) + '...' : 'No summary available.'}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
