import React from 'react';
import Link from 'next/link';

async function getSupabaseData(table: string, select: string = '*', filters: string = '') {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=${select}${filters ? '&' + filters : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.statusText}`);
  return res.json();
}

export default async function PortfolioPage() {
  const documents = await getSupabaseData('portfolio_documents', '*', 'order=created_at.desc');
  const tests = await getSupabaseData('language_tests', '*', 'order=test_date.desc.nullslast');
  const recommendations = await getSupabaseData('recommendation_letters', '*', 'order=deadline.asc.nullslast');
  const links = await getSupabaseData('portfolio_links', '*', 'order=created_at.desc');
  const research = await getSupabaseData('publications', '*', 'is_user_portfolio=eq.true&order=created_at.desc');

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111' }}>Academic Portfolio & Documents</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Manage CVs, Statements, Scores, and Publications</p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Documents (CVs, SOPs, Transcripts)</h2>
        {documents && documents.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
            {documents.map((doc: any) => (
              <li key={doc.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{doc.title} (v{doc.version})</strong>
                  <span style={{ background: '#e6f2ff', color: '#0056b3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{doc.category}</span>
                </div>
                {doc.description && <p style={{ margin: '0.5rem 0' }}>{doc.description}</p>}
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Added: {new Date(doc.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888' }}>No documents found.</p>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Research & Publications</h2>
        {research && research.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
            {research.map((pub: any) => (
              <li key={pub.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <strong>{pub.title}</strong> - <span style={{ fontStyle: 'italic' }}>{pub.work_type}</span>
                {pub.publication_date && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Date: {pub.publication_date}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888' }}>No research works found.</p>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Language & Standardized Tests</h2>
        {tests && tests.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {tests.map((test: any) => (
              <div key={test.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{test.test_type}</h3>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Score: {test.total_score}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Date: {test.test_date || 'Unknown'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#888' }}>No test scores found.</p>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Recommendation Letters</h2>
        {recommendations && recommendations.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
            {recommendations.map((rec: any) => (
              <li key={rec.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{rec.recommender_name}</strong>
                  <span style={{ fontSize: '0.9rem', color: '#555' }}>{rec.recommender_institution}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#fff3cd', color: '#856404', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{rec.status}</span>
                  {rec.deadline && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#d9534f' }}>Due: {rec.deadline}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888' }}>No recommendations found.</p>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Portfolio Links</h2>
        {links && links.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {links.map((link: any) => (
              <li key={link.id} style={{ margin: '0.5rem 0' }}>
                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{link.platform}:</span>
                <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'none' }}>{link.url}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888' }}>No links found.</p>
        )}
      </section>

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
