import { requireSession } from '@/lib/session';
import { PageHeader, Section } from '@/components/ui';
import { saveSettings } from '../actions';
import { FUNDING_PREFERENCES } from '@/lib/constants';

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
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings & Profile"
        description="Configure your academic profile and intelligence preferences."
      />

      <form action={saveSettings} className="space-y-8">
        <Section title="Intelligence Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Target Countries (comma separated)</label>
              <input type="text" name="countries" defaultValue={getArrayValue(settings?.countries)} className="input" placeholder="US, UK, Canada" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Research Areas (comma separated)</label>
              <input type="text" name="research_areas" defaultValue={getArrayValue(settings?.subjects)} className="input" placeholder="Machine Learning, NLP" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Keywords (comma separated)</label>
              <input type="text" name="keywords" defaultValue={getArrayValue(settings?.keywords)} className="input" placeholder="LLMs, Transformers" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Exclude Keywords (comma separated)</label>
              <input type="text" name="exclude_keywords" defaultValue={getArrayValue(settings?.exclude_keywords)} className="input" placeholder="Computer Vision, Robotics" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Match Score (0-100)</label>
              <input type="number" name="min_score" defaultValue={settings?.min_score || 60} min="0" max="100" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Funding Preference</label>
              <select name="funding" defaultValue={settings?.preferences?.funding || 'FULLY_FUNDED'} className="input">
                {FUNDING_PREFERENCES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Academic Profile">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Summary</label>
              <textarea name="profile_summary" rows={3} defaultValue={settings?.profile_summary || ''} className="input" placeholder="Briefly describe your background and goals..." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Degrees (comma separated)</label>
                <input type="text" name="degrees" defaultValue={getArrayValue(settings?.academic_background?.degrees)} className="input" placeholder="BSc Computer Science, MSc AI" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                <input type="text" name="skills" defaultValue={getArrayValue(settings?.technical_skills?.skills)} className="input" placeholder="Python, PyTorch, React" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Academic Summary</label>
              <textarea name="academic_summary" rows={3} defaultValue={settings?.academic_background?.summary || ''} className="input" placeholder="Academic achievements, GPA, awards..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Research Interests (comma separated)</label>
              <input type="text" name="interests" defaultValue={getArrayValue(settings?.research_background?.interests)} className="input" placeholder="Agentic AI, Reinforcement Learning" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Research Experience</label>
              <textarea name="research_experience" rows={4} defaultValue={settings?.research_background?.experience || ''} className="input" placeholder="Describe past research projects..." />
            </div>
          </div>
        </Section>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn btn-primary px-8">Save All Settings</button>
        </div>
      </form>
    </div>
  );
}
