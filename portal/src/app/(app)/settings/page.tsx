import { requireSession } from '@/lib/session';
import { PageHeader, Section } from '@/components/ui';
import { saveSettings } from '../actions';
import { FUNDING_PREFERENCES } from '@/lib/constants';
import { CountryMultiSelect } from '@/components/CountryMultiSelect';

export const metadata = {
  title: 'Settings | NEXTPHD',
};

export default async function SettingsPage() {
  const { supabase, user } = await requireSession();

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  const getArrayValue = (val: any) => Array.isArray(val) ? val.join(', ') : '';

  return (
    <div>
      <PageHeader
        title="Settings & Profile"
        description="Configure your academic profile and intelligence preferences for personalized matching."
      />

      <form action={saveSettings} style={{ maxWidth: '800px' }}>
        <Section title="Intelligence Parameters">
          <div className="card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label>Target Countries</label>
                <CountryMultiSelect name="countries" defaultValue={settings?.countries || []} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Countries where you are interested in doing your PhD</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Research Areas (comma separated)</label>
                <input type="text" name="research_areas" defaultValue={getArrayValue(settings?.subjects)} className="form-control" placeholder="Machine Learning, NLP" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label>Keywords (comma separated)</label>
                <input type="text" name="keywords" defaultValue={getArrayValue(settings?.keywords)} className="form-control" placeholder="LLMs, Transformers, Multi-agent Systems" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Topics to prioritize in matching</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label>Exclude Keywords (comma separated)</label>
                <input type="text" name="exclude_keywords" defaultValue={getArrayValue(settings?.exclude_keywords)} className="form-control" placeholder="Computer Vision, Robotics" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Topics to penalize or ignore</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Minimum Match Score (0-100)</label>
                <input type="number" name="min_score" defaultValue={settings?.min_score || 60} min="0" max="100" className="form-control" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Opportunities below this score are hidden</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Funding Preference</label>
                <select name="funding" defaultValue={settings?.preferences?.funding || 'FULLY_FUNDED'} className="form-control">
                  {FUNDING_PREFERENCES.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Your requirement for PhD positions</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Academic Profile">
          <div className="card">
            <div className="form-group">
              <label>Profile Summary</label>
              <textarea name="profile_summary" rows={3} defaultValue={settings?.profile_summary || ''} className="form-control" placeholder="Briefly describe your background and goals..." />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Degrees (comma separated)</label>
                <input type="text" name="degrees" defaultValue={getArrayValue(settings?.academic_background?.degrees)} className="form-control" placeholder="BSc Computer Science, MSc AI" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Technical Skills (comma separated)</label>
                <input type="text" name="skills" defaultValue={getArrayValue(settings?.technical_skills?.skills)} className="form-control" placeholder="Python, PyTorch, React" />
              </div>
            </div>

            <div className="form-group">
              <label>Academic Summary</label>
              <textarea name="academic_summary" rows={3} defaultValue={settings?.academic_background?.summary || ''} className="form-control" placeholder="Academic achievements, GPA, awards..." />
            </div>

            <div className="form-group">
              <label>Research Interests (comma separated)</label>
              <input type="text" name="interests" defaultValue={getArrayValue(settings?.research_background?.interests)} className="form-control" placeholder="Agentic AI, Reinforcement Learning" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Research Experience</label>
              <textarea name="research_experience" rows={4} defaultValue={settings?.research_background?.experience || ''} className="form-control" placeholder="Describe past research projects, thesis work, and publications..." />
            </div>
          </div>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1rem' }}>
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
