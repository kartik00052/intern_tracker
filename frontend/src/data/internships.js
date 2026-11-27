const agoHours = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const agoDays = (days, hours = 0) => agoHours(days * 24 + hours);

const aheadDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const hashFor = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let digest = '';
  for (let i = 0; i < 8; i += 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    digest += (h >>> 0).toString(16).padStart(8, '0');
  }
  return `sha256:${digest}`;
};

const normalizeTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const companyCatalog = [
  ['C-001', 'Figma', 'generic'],
  ['C-002', 'Stripe', 'greenhouse'],
  ['C-003', 'Notion', 'ashby'],
  ['C-004', 'Razorpay', 'greenhouse'],
  ['C-005', 'Postman', 'lever'],
  ['C-006', 'Innovaccer', 'smartrecruiters'],
  ['C-007', 'Adobe', 'generic'],
  ['C-008', 'Barclays', 'smartrecruiters'],
  ['C-009', 'Atlassian', 'generic'],
  ['C-010', 'Zoho', 'generic'],
  ['C-011', 'Airtable', 'ashby'],
  ['C-012', 'Linear', 'ashby'],
  ['C-013', 'Vercel', 'ashby'],
  ['C-014', 'GitHub', 'generic'],
  ['C-015', 'Shopify', 'generic'],
  ['C-016', 'Databricks', 'greenhouse'],
  ['C-017', 'Flipkart', 'smartrecruiters'],
  ['C-018', 'Swiggy', 'greenhouse'],
  ['C-019', 'Zomato', 'generic'],
  ['C-020', 'Meesho', 'ashby'],
  ['C-021', 'CRED', 'lever'],
  ['C-022', 'Groww', 'smartrecruiters'],
  ['C-023', 'BrowserStack', 'greenhouse'],
  ['C-024', 'Freshworks', 'greenhouse'],
];

const locations = [
  { label: 'Bengaluru, India', city: 'Bengaluru', country: 'India', remote: false },
  { label: 'Hyderabad, India', city: 'Hyderabad', country: 'India', remote: false },
  { label: 'Pune, India', city: 'Pune', country: 'India', remote: false },
  { label: 'Delhi NCR, India', city: 'Delhi NCR', country: 'India', remote: false },
  { label: 'Mumbai, India', city: 'Mumbai', country: 'India', remote: false },
  { label: 'Chennai, India', city: 'Chennai', country: 'India', remote: false },
  { label: 'Gurugram, India', city: 'Gurugram', country: 'India', remote: false },
  { label: 'Remote — India', city: 'Remote', country: 'India', remote: true },
  { label: 'Remote — Global', city: 'Remote', country: 'Global', remote: true },
  { label: 'San Francisco, United States', city: 'San Francisco', country: 'United States', remote: false },
  { label: 'New York, United States', city: 'New York', country: 'United States', remote: false },
  { label: 'London, United Kingdom', city: 'London', country: 'United Kingdom', remote: false },
  { label: 'Dublin, Ireland', city: 'Dublin', country: 'Ireland', remote: false },
  { label: 'Berlin, Germany', city: 'Berlin', country: 'Germany', remote: false },
  { label: 'Singapore, Singapore', city: 'Singapore', country: 'Singapore', remote: false },
];

const titles = [
  'Product Design Intern',
  'Frontend Engineering Intern',
  'Data Science Intern',
  'Backend Engineering Intern',
  'ML Research Intern',
  'Growth Marketing Intern',
  'Product Management Intern',
  'UX Research Intern',
  'DevOps Engineering Intern',
  'Android Engineering Intern',
  'iOS Engineering Intern',
  'Full Stack Engineering Intern',
  'Data Engineering Intern',
  'Business Analyst Intern',
  'Brand Design Intern',
  'Content Strategy Intern',
  'Sales Development Intern',
  'Customer Success Intern',
  'Security Engineering Intern',
  'Platform Engineering Intern',
  'Applied AI Intern',
  'Quantitative Research Intern',
  'Operations Intern',
  'People Operations Intern',
  'Motion Design Intern',
  'Web Engineering Intern',
  'Mobile Design Intern',
  'Analytics Engineering Intern',
  'Infrastructure Engineering Intern',
  'Product Analytics Intern',
  'Technical Writing Intern',
  'Community Management Intern',
  'Partnerships Intern',
  'Finance Intern',
  'Legal Intern',
  'Machine Learning Engineering Intern',
  'Frontend Engineering Intern',
  'Data Science Intern',
  'Product Design Intern',
  'Backend Engineering Intern',
  'Growth Marketing Intern',
  'DevOps Engineering Intern',
  'UX Research Intern',
  'Data Engineering Intern',
  'Full Stack Engineering Intern',
  'Business Analyst Intern',
  'ML Research Intern',
  'Product Management Intern',
  'Android Engineering Intern',
  'iOS Engineering Intern',
  'Security Engineering Intern',
  'Platform Engineering Intern',
  'Applied AI Intern',
  'Quantitative Research Intern',
];

const locationPattern = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  0, 7, 1, 9, 2, 3, 8, 11, 4, 5, 6, 7, 13, 1, 14,
  0, 10, 2, 12, 7, 4, 6, 8, 11, 0, 3, 9, 5, 7, 1,
  2, 13, 6, 14, 4, 8, 12, 10, 0,
];

const statuses = [
  ...Array.from({ length: 36 }, () => 'live'),
  ...Array.from({ length: 8 }, () => 'redirected'),
  ...Array.from({ length: 6 }, () => 'closed'),
  ...Array.from({ length: 4 }, () => 'dead'),
];

const nullStipendIndices = new Set([4, 9, 13, 18, 23, 27, 32, 37, 42, 47, 52]);
const nullDeadlineIndices = new Set([1, 3, 6, 10, 12, 15, 17, 20, 22, 25, 28, 31, 34, 39, 41, 45, 48, 51, 53]);
const nullDurationIndices = new Set([0, 5, 8, 11, 14, 19, 21, 24, 29, 33, 38, 40, 44, 49, 52, 53]);
const nullExperienceIndices = new Set([0, 2, 4, 7, 9, 11, 13, 16, 18, 20, 23, 26, 29, 31, 34, 36, 39, 43, 46, 49, 51, 53]);

const inrRanges = [[15000, 30000], [20000, 40000], [25000, 50000], [40000, 80000], [30000, 60000], [50000, 90000]];
const usdRanges = [[3000, 6000], [4000, 7000], [5000, 8000], [6000, 10000]];
const experienceNotes = ['Final-year student', '0-1 years', '1-2 years'];

const provenanceSets = [
  { stipend: 'ats_api', deadline: 'ats_api', duration: null, experience: null, skills: 'ats_api', location: 'ats_api' },
  { stipend: 'json_ld', deadline: null, duration: 'json_ld', experience: 'html', skills: 'json_ld', location: 'json_ld' },
  { stipend: null, deadline: 'html', duration: null, experience: null, skills: 'html', location: 'html' },
];

const skillsFor = (title) => {
  const value = title.toLowerCase();
  if (value.includes('design')) return ['Figma', 'Design Systems', 'Prototyping'];
  if (value.includes('frontend') || value.includes('web')) return ['React', 'TypeScript', 'CSS'];
  if (value.includes('backend') || value.includes('platform') || value.includes('infrastructure')) return ['Node.js', 'PostgreSQL', 'AWS'];
  if (value.includes('data ') || value.includes('analytics')) return ['SQL', 'Python', 'Looker'];
  if (value.includes('ml') || value.includes('machine learning') || value.includes('applied ai')) return ['Python', 'PyTorch', 'Pandas'];
  if (value.includes('growth') || value.includes('marketing') || value.includes('content')) return ['SEO', 'Analytics', 'Copywriting'];
  if (value.includes('product')) return ['Roadmapping', 'User Interviews', 'SQL'];
  if (value.includes('security')) return ['OWASP', 'Python', 'Cloud Security'];
  if (value.includes('android')) return ['Kotlin', 'Android SDK', 'Jetpack Compose'];
  if (value.includes('ios')) return ['Swift', 'SwiftUI', 'Xcode'];
  if (value.includes('quantitative')) return ['Python', 'Statistics', 'Excel'];
  if (value.includes('finance') || value.includes('legal') || value.includes('people') || value.includes('operations') || value.includes('partnerships') || value.includes('sales') || value.includes('customer') || value.includes('community')) return ['Excel', 'Stakeholder Management', 'Process Design'];
  return ['Communication', 'Research', 'Excel'];
};

const stipendFor = (index, location) => {
  if (nullStipendIndices.has(index)) return { min: null, max: null, currency: null };
  const usd = location.country !== 'India';
  const range = usd ? usdRanges[index % usdRanges.length] : inrRanges[(index + 2) % inrRanges.length];
  return { min: range[0], max: range[1], currency: usd ? 'USD' : 'INR' };
};

const deadlineFor = (index, status) => {
  if (nullDeadlineIndices.has(index)) return null;
  if (status === 'closed' || status === 'dead') return aheadDays(-(2 + (index % 8)));
  return aheadDays(3 + ((index * 7) % 43));
};

const durationFor = (index) => (nullDurationIndices.has(index) ? null : 1 + (index % 6));

const experienceFor = (index) => (nullExperienceIndices.has(index) ? null : experienceNotes[index % experienceNotes.length]);

const duplicateCountFor = (index) => {
  if (index % 9 === 0) return 4;
  if (index % 5 === 0) return 3;
  if (index % 3 === 0) return 2;
  return 1;
};

const sourceRecordsFor = (internship, discoveredHours, duplicateCount) => {
  const count = duplicateCount === 4 ? 3 : duplicateCount === 3 || duplicateCount === 2 ? 2 : 1;
  const sourceNames = [`${internship.ats}_api`, 'json_ld', 'company_html'];
  return Array.from({ length: count }, (_, sourceIndex) => ({
    source: sourceNames[sourceIndex],
    ats_job_id: `${internship.ats.toUpperCase()}-${internship.id.slice(4)}-${sourceIndex + 1}`,
    url: `https://example.com/sources/${internship.id}/${sourceNames[sourceIndex]}`,
    discovered_at: agoHours(discoveredHours + sourceIndex * 2),
    field_provenance: { ...provenanceSets[sourceIndex] },
  }));
};

export const internships = Array.from({ length: 54 }, (_, index) => {
  const id = `INT-${String(401 + index)}`;
  const [companyId, companyName, ats] = companyCatalog[(index * 7) % companyCatalog.length];
  const title = titles[index];
  const location = locations[locationPattern[index]];
  const status = statuses[index];
  const stipend = stipendFor(index, location);
  const duplicateCount = duplicateCountFor(index);
  const postedHours = 6 + ((index * 17) % 690);
  const discoveredHours = Math.max(1, postedHours - (3 + (index % 7)));
  const sourceRecords = sourceRecordsFor({ id, ats }, discoveredHours, duplicateCount);

  return {
    id,
    company_id: companyId,
    company_name: companyName,
    title,
    normalized_title: normalizeTitle(title),
    location: location.label,
    city: location.city,
    country: location.country,
    remote: location.remote,
    employment_type: 'Internship',
    stipend_min: stipend.min,
    stipend_max: stipend.max,
    currency: stipend.currency,
    duration_months: durationFor(index),
    deadline: deadlineFor(index, status),
    posted_at: agoDays(Math.floor(postedHours / 24), postedHours % 24),
    discovered_at: agoHours(discoveredHours),
    last_verified_at: agoHours(1 + ((index % 24) * 3)),
    status,
    ats,
    apply_url: `https://example.com/apply/${id}`,
    skills: skillsFor(title),
    experience: experienceFor(index),
    source_records: sourceRecords,
    content_hash: hashFor(id),
    duplicate_count: duplicateCount,
  };
});

const httpStatusFor = (status, index) => {
  if (status === 'live') return 200;
  if (status === 'redirected') return index % 2 === 0 ? 301 : 302;
  if (status === 'closed') return 410;
  return index % 2 === 0 ? 0 : 404;
};

const historyFor = (httpStatus, checkedHours, count) => Array.from({ length: count }, (_, index) => ({
  status: httpStatus,
  checked_at: agoHours(checkedHours + (count - index - 1) * 8),
}));

export const linkChecks = internships.map((internship, index) => {
  const httpStatus = httpStatusFor(internship.status, index);
  const checkedHours = 2 + ((index * 7) % 30);
  const historyCount = 4 + (index % 3);

  return {
    internship_id: internship.id,
    http_status: httpStatus,
    latency_ms: 80 + ((index * 37) % 821),
    redirect_to: internship.status === 'redirected' ? `https://example.com/redirect/${internship.id}/apply` : null,
    checked_at: agoHours(checkedHours),
    history: historyFor(httpStatus, checkedHours, historyCount),
  };
});
