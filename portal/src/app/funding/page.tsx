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

function StatusBadge({ status }: { status: string }) {
  let color = '#888';
  let bg = '#eee';
  if (status === 'VERIFIED') { color = '#155724'; bg = '#d4edda'; }
  else if (status === 'UNVERIFIED' || status === 'NEEDS_VERIFICATION') { color = '#856404'; bg = '#fff3cd'; }
  else if (status === 'EXPIRED') { color = '#721c24'; bg = '#f8d7da'; }

  return (
    <span style={{ 
      display: 'inline-block', 
      padding: '0.2rem 0.5rem', 
      background: bg, 
      color: color, 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 'bold',
      marginLeft: '0.5rem'
    }}>
      {status || 'UNKNOWN'}
    </span>
  );
}

export default async function FundingPage() {
  const fundingInfo = await getSupabaseData('funding_intelligence', '*, opportunities(title), universities(name)', 'order=created_at.desc');
  const visaInfo = await getSupabaseData('visa_intelligence', '*, universities(name), opportunities(title)', 'order=created_at.desc');
  const livingCosts = await getSupabaseData('living_costs', '*, universities(name)', 'order=created_at.desc');
  const healthcareInfo = await getSupabaseData('healthcare_intelligence', '*, universities(name), opportunities(title)', 'order=created_at.desc');

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111' }}>Funding & Relocation Intelligence</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Track stipends, visas, living costs, and healthcare coverage.</p>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Opportunity Funding</h2>
        {fundingInfo && fundingInfo.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {fundingInfo.map((item: any) => (
              <div key={item.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {item.opportunities?.title || 'General'} at {item.universities?.name || item.country || 'Unknown'}
                  <StatusBadge status={item.verification_status} />
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <p><strong>Status:</strong> {item.funding_status}</p>
                    <p><strong>Stipend:</strong> {item.stipend_amount ? `${item.stipend_amount} ${item.stipend_currency}` : 'NOT_STATED'}</p>
                    <p><strong>Salary:</strong> {item.salary_amount ? `${item.salary_amount} ${item.salary_currency}` : 'NOT_STATED'}</p>
                  </div>
                  <div>
                    <p><strong>Tuition Waiver:</strong> {item.tuition_waiver_status}</p>
                    <p><strong>Assistantship:</strong> {item.assistantship_type || 'UNKNOWN'}</p>
                    <p><strong>Duration:</strong> {item.funding_duration_months ? `${item.funding_duration_months} months` : 'UNKNOWN'}</p>
                  </div>
                </div>
                {item.source_url && (
                  <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#555' }}>
                    <strong>Source:</strong> <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: '#0070f3' }}>{item.source_title || 'Link'}</a> 
                    {' '}(Retrieved: {new Date(item.retrieved_at).toLocaleDateString()})
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : <p style={{ color: '#888' }}>No funding intelligence found.</p>}
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Visa & Immigration</h2>
        {visaInfo && visaInfo.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {visaInfo.map((item: any) => (
              <div key={item.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {item.country} Visa Info
                  <StatusBadge status={item.verification_status} />
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}><strong>Category:</strong> {item.visa_category || 'NOT_STATED'}</p>
                <div style={{ fontSize: '0.9rem', color: '#444' }}>
                  <p><strong>Student Info:</strong> {item.student_visa_info || 'UNKNOWN'}</p>
                  <p><strong>Work Permission:</strong> {item.work_permission_info || 'UNKNOWN'}</p>
                  <p><strong>Dependents:</strong> {item.dependent_visa_availability || 'UNKNOWN'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ color: '#888' }}>No visa intelligence found.</p>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <section>
          <h2>Living Costs</h2>
          {livingCosts && livingCosts.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {livingCosts.map((item: any) => (
                <li key={item.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <strong>{item.city ? `${item.city}, ${item.country}` : item.country}</strong>
                  <StatusBadge status={item.verification_status} />
                  <p style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>{item.estimate_amount} {item.currency} <span style={{ fontSize: '0.9rem', color: '#666' }}>/ {item.period.toLowerCase()}</span></p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}><strong>Category:</strong> {item.cost_category}</p>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: '#888' }}>No living cost estimates found.</p>}
        </section>

        <section>
          <h2>Healthcare & Insurance</h2>
          {healthcareInfo && healthcareInfo.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {healthcareInfo.map((item: any) => (
                <li key={item.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <strong>{item.country || 'General'}</strong>
                  {item.universities?.name && ` - ${item.universities.name}`}
                  <StatusBadge status={item.verification_status} />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <p><strong>Requirement:</strong> {item.insurance_requirement || 'NOT_STATED'}</p>
                    <p><strong>University Provided:</strong> {item.university_provided === true ? 'Yes' : item.university_provided === false ? 'No' : 'UNKNOWN'}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: '#888' }}>No healthcare intelligence found.</p>}
        </section>
      </div>

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
