import { requireSession } from '@/lib/session';
import { PageHeader, Section, EmptyState, StatusBadge } from '@/components/ui';
import { DOCUMENT_CATEGORIES, LINK_PLATFORMS, TEST_TYPES, WORK_TYPES, RECOMMENDATION_STATUSES } from '@/lib/constants';
import { addPortfolioDocument, addLanguageTest, addRecommendation, addPortfolioLink, addPortfolioWork } from '../actions';

export const metadata = {
  title: 'Portfolio | NEXTPHD',
};

export default async function PortfolioPage() {
  const { supabase, user } = await requireSession();

  const [
    { data: documents },
    { data: tests },
    { data: recommendations },
    { data: links },
    { data: works }
  ] = await Promise.all([
    supabase.from('portfolio_documents').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('language_tests').select('*').eq('owner_id', user.id).order('test_date', { ascending: false }),
    supabase.from('recommendation_letters').select('*, applications(title)').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('portfolio_links').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('publications').select('*').eq('owner_id', user.id).eq('is_user_portfolio', true).order('publication_date', { ascending: false })
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio & Application Materials"
        description="Manage your documents, test scores, recommendations, and past work."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Section title="Documents">
            {!documents?.length ? (
              <EmptyState title="No documents added yet." />
            ) : (
              <div className="space-y-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="card flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-dimmed">{doc.category} - v{doc.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <form action={addPortfolioDocument} className="card bg-gray-50 mt-4 space-y-4">
              <h4 className="font-medium">Add Document</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" name="title" required className="input" placeholder="e.g., Main CV" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select name="category" className="input">
                    {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Document</button>
            </form>
          </Section>

          <Section title="Standardized Tests">
            {!tests?.length ? (
              <EmptyState title="No test scores added yet." />
            ) : (
              <div className="space-y-4">
                {tests.map((test: any) => (
                  <div key={test.id} className="card">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{test.test_type}</h4>
                      <span className="font-bold">{test.total_score}</span>
                    </div>
                    {test.test_date && <p className="text-sm text-dimmed">Taken: {new Date(test.test_date).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            )}
            
            <form action={addLanguageTest} className="card bg-gray-50 mt-4 space-y-4">
              <h4 className="font-medium">Add Test Score</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Type</label>
                  <select name="test_type" className="input">
                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Score</label>
                  <input type="text" name="total_score" className="input" placeholder="e.g., 110" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="test_date" className="input" />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Test</button>
            </form>
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Recommendations">
            {!recommendations?.length ? (
              <EmptyState title="No recommendation letters requested yet." />
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec: any) => (
                  <div key={rec.id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{rec.recommender_name}</h4>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="text-sm text-dimmed">{rec.recommender_institution}</p>
                  </div>
                ))}
              </div>
            )}
            
            <form action={addRecommendation} className="card bg-gray-50 mt-4 space-y-4">
              <h4 className="font-medium">Add Recommender</h4>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" name="recommender_name" required className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Institution</label>
                  <input type="text" name="recommender_institution" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" name="recommender_email" className="input" />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Recommender</button>
            </form>
          </Section>

          <Section title="Links & Profiles">
            {!links?.length ? (
              <EmptyState title="No links added yet." />
            ) : (
              <div className="space-y-4">
                {links.map((link: any) => (
                  <div key={link.id} className="card flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{link.platform}</h4>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline truncate max-w-xs block">
                        {link.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <form action={addPortfolioLink} className="card bg-gray-50 mt-4 space-y-4">
              <h4 className="font-medium">Add Link</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Platform</label>
                  <select name="platform" className="input">
                    {LINK_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input type="url" name="url" required className="input" placeholder="https://..." />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Link</button>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}
