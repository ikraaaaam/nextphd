// Starter universities defined in NEXTPHD_FINAL_BUILD_SPEC.md §42 ("Initial University Seed").
// Per the spec these are STARTING RECORDS ONLY: they are not assumed to be suitable,
// funded or accepting applications, so they are inserted UNVERIFIED with no fabricated details.
// Countries match supabase/seed.sql (the certified Phase 1 seed).
export const STARTER_UNIVERSITIES: ReadonlyArray<{ name: string; country: string }> = [
  { name: 'MBZUAI', country: 'United Arab Emirates' },
  { name: 'KFUPM', country: 'Saudi Arabia' },
  { name: 'KAUST', country: 'Saudi Arabia' },
  { name: 'GIST', country: 'South Korea' },
  { name: 'DGIST', country: 'South Korea' },
  { name: 'UNIST', country: 'South Korea' },
  { name: 'KAIST', country: 'South Korea' },
  { name: 'Monash Malaysia', country: 'Malaysia' },
  { name: 'UTM', country: 'Malaysia' },
];

export const COUNTRY_CATALOGUE: Record<string, string[]> = {
  'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Qatar'],
  'North America': ['United States', 'Canada'],
  'Asia-Pacific': ['Australia', 'Japan', 'Singapore', 'South Korea', 'Hong Kong', 'Malaysia'],
  'Europe': ['Germany', 'Netherlands', 'Switzerland', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Austria', 'Ireland'],
};

export const SUPPORTED_COUNTRIES = Object.values(COUNTRY_CATALOGUE).flat();
export const SUPPORTED_REGIONS = Object.keys(COUNTRY_CATALOGUE);


export const OPPORTUNITY_STATUSES = ['NEW', 'SAVED', 'VERIFY', 'CONTACTED', 'RESPONSE_RECEIVED', 'APPLICATION_PREPARING', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'IGNORED'] as const;
export const APPLICATION_STATUSES = ['INTERESTED', 'RESEARCHING', 'CONTACTED', 'PREPARING', 'APPLIED', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED'] as const;
export const OUTREACH_STATUSES = ['TO_CONTACT', 'CONTACTED', 'RESPONDED', 'FOLLOW_UP', 'IGNORED'] as const;
export const RESPONSE_SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN'] as const;
export const RECOMMENDATION_STATUSES = ['REQUESTED', 'ACCEPTED', 'DECLINED', 'DRAFTING', 'SUBMITTED', 'RECEIVED'] as const;
export const DOCUMENT_CATEGORIES = ['CV', 'TRANSCRIPT', 'CERTIFICATE', 'SOP', 'RESEARCH_STATEMENT', 'OTHER'] as const;
export const WORK_TYPES = ['PUBLICATION', 'MANUSCRIPT', 'THESIS', 'PROJECT'] as const;
export const TEST_TYPES = ['IELTS', 'TOEFL', 'GRE', 'GMAT', 'OTHER'] as const;
export const LINK_PLATFORMS = ['GITHUB', 'PERSONAL_SITE', 'LINKEDIN', 'GOOGLE_SCHOLAR', 'RESEARCHGATE', 'OTHER'] as const;
export const FUNDING_PREFERENCES = ['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'ANY'] as const;
