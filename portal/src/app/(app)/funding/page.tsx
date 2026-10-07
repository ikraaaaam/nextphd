import { requireSession } from '@/lib/session';
import { PageHeader, Section, EmptyState, StatusBadge } from '@/components/ui';

export const metadata = {
  title: 'Funding | NEXTPHD',
};

const VERIFICATION_STATUSES = ['VERIFIED', 'UNVERIFIED', 'NEEDS_VERIFICATION', 'EXPIRED'];

export default async function FundingPage() {
  const { supabase, user } = await requireSession();

  const [
    { data: fundingInfo },
    { data: visaInfo },
    { data: livingCosts },
    { data: healthcareInfo }
  ] = await Promise.all([
    supabase.from('funding_intelligence').select('*, opportunities(title), universities(name)').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('visa_intelligence').select('*, universities(name), opportunities(title)').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('living_costs').select('*, universities(name)').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('healthcare_intelligence').select('*, universities(name), opportunities(title)').eq('owner_id', user.id).order('created_at', { ascending: false })
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Funding & Relocation Intelligence"
        description="Track stipends, visas, living costs, and healthcare coverage."
      />

      <Section title="Opportunity Funding">
        {!fundingInfo?.length ? (
          <EmptyState title="No funding intelligence found." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fundingInfo.map((item: any) => (
              <div key={item.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {item.opportunities?.title || 'General'} at {item.universities?.name || item.country || 'Unknown'}
                  </h3>
                  <StatusBadge status={item.verification_status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dimmed mb-1">Status</p>
                    <p className="font-medium">{item.funding_status}</p>
                  </div>
                  <div>
                    <p className="text-dimmed mb-1">Tuition Waiver</p>
                    <p className="font-medium">{item.tuition_waiver_status}</p>
                  </div>
                  <div>
                    <p className="text-dimmed mb-1">Stipend</p>
                    <p className="font-medium">{item.stipend_amount ? `${item.stipend_amount} ${item.stipend_currency}` : 'Not Stated'}</p>
                  </div>
                  <div>
                    <p className="text-dimmed mb-1">Salary</p>
                    <p className="font-medium">{item.salary_amount ? `${item.salary_amount} ${item.salary_currency}` : 'Not Stated'}</p>
                  </div>
                  <div>
                    <p className="text-dimmed mb-1">Assistantship</p>
                    <p className="font-medium">{item.assistantship_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-dimmed mb-1">Duration</p>
                    <p className="font-medium">{item.funding_duration_months ? `${item.funding_duration_months} months` : 'Unknown'}</p>
                  </div>
                </div>

                {item.source_url && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                      View Source: {item.source_title || 'Link'}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Visa & Immigration">
        {!visaInfo?.length ? (
          <EmptyState title="No visa intelligence found." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visaInfo.map((item: any) => (
              <div key={item.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{item.country} Visa Info</h3>
                  <StatusBadge status={item.verification_status} />
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-dimmed">Category: </span>
                    <span className="font-medium">{item.visa_category || 'Not Stated'}</span>
                  </div>
                  <div>
                    <span className="text-dimmed">Student Info: </span>
                    <span>{item.student_visa_info || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-dimmed">Work Permission: </span>
                    <span>{item.work_permission_info || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-dimmed">Dependents: </span>
                    <span>{item.dependent_visa_availability || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section title="Living Costs">
          {!livingCosts?.length ? (
            <EmptyState title="No living cost estimates found." />
          ) : (
            <div className="space-y-4">
              {livingCosts.map((item: any) => (
                <div key={item.id} className="card flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{item.city ? `${item.city}, ${item.country}` : item.country}</h4>
                    <p className="text-sm text-dimmed">{item.cost_category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{item.estimate_amount} {item.currency}</p>
                    <p className="text-xs text-dimmed uppercase">/ {item.period.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Healthcare & Insurance">
          {!healthcareInfo?.length ? (
            <EmptyState title="No healthcare intelligence found." />
          ) : (
            <div className="space-y-4">
              {healthcareInfo.map((item: any) => (
                <div key={item.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">
                      {item.country || 'General'}
                      {item.universities?.name && ` - ${item.universities.name}`}
                    </h4>
                    <StatusBadge status={item.verification_status} />
                  </div>
                  
                  <div className="space-y-2 text-sm mt-3">
                    <p>
                      <span className="text-dimmed">Requirement: </span>
                      {item.insurance_requirement || 'Not Stated'}
                    </p>
                    <p>
                      <span className="text-dimmed">University Provided: </span>
                      <span className="font-medium">
                        {item.university_provided === true ? 'Yes' : item.university_provided === false ? 'No' : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
