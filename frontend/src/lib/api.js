import { internships, linkChecks } from '../data/internships.js';
import { companies } from '../data/companies.js';
import { crawlRuns } from '../data/crawlRuns.js';
import { overviewData } from '../data/overview.js';

const ATS_PROVIDERS = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'generic'];
const STATUSES = ['live', 'redirected', 'closed', 'dead'];
const POSTED_WITHIN_HOURS = { '24': 24, '24h': 24, '7': 168, '7d': 168, '30': 720, '30d': 720 };

const delay = () => new Promise((resolve) => {
  window.setTimeout(resolve, 150 + Math.round(Math.random() * 250));
});

const listify = (value) => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value]);

const linkById = new Map(linkChecks.map((check) => [check.internship_id, check]));
const withLink = (record) => ({ ...record, link_check: linkById.get(record.id) || null });

const searchable = (record) => [
  record.id,
  record.title,
  record.normalized_title,
  record.company_name,
  record.location,
  record.city,
  record.country,
  record.ats,
  record.status,
  ...(record.skills || []),
].join(' ').toLowerCase();

const fuzzyIncludes = (text, token) => {
  if (text.includes(token)) return true;
  let cursor = 0;
  for (const char of text) {
    if (char === token[cursor]) cursor += 1;
    if (cursor === token.length) return true;
  }
  return false;
};

const matchesQuery = (record, tokens) => tokens.every((token) => fuzzyIncludes(searchable(record), token));

function countBy(records, selector) {
  return records.reduce((accumulator, record) => {
    const value = selector(record);
    if (value == null || value === '') return accumulator;
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});
}

function facet(values, counts, prefix = '') {
  return values
    .filter((value) => counts[value])
    .map((value) => ({ value: `${prefix}${value}`, label: value, count: counts[value] }));
}

function buildFacets() {
  const locationCounts = countBy(internships, (record) => record.location);
  const cityCounts = countBy(internships, (record) => record.city);
  const skillCounts = countBy(internships.flatMap((record) => record.skills || []), (skill) => skill);
  const durationCounts = countBy(internships, (record) => record.duration_months);
  const statusCounts = countBy(internships, (record) => record.status);
  const atsCounts = countBy(internships, (record) => record.ats);
  const skills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a] || a.localeCompare(b)).slice(0, 18);
  return {
    locations: facet(Object.keys(locationCounts).sort(), locationCounts, 'loc:'),
    cities: facet(Object.keys(cityCounts).sort(), cityCounts, 'city:'),
    ats: facet(ATS_PROVIDERS, atsCounts),
    statuses: facet(STATUSES, statusCounts),
    skills: facet(skills, skillCounts),
    duration: facet(Object.keys(durationCounts).sort((a, b) => Number(a) - Number(b)), durationCounts).map((item) => ({ ...item, value: Number(item.value) })),
  };
}

function matchesLocation(record, values) {
  if (!values.length) return true;
  return values.some((raw) => {
    const value = String(raw);
    if (value.startsWith('loc:')) return record.location === value.slice(4);
    if (value.startsWith('city:')) return record.city === value.slice(5);
    return record.location === value || record.city === value || record.country === value;
  });
}

function internshipComparator(sort) {
  switch (sort) {
    case 'deadline':
      return (a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline) || a.id.localeCompare(b.id);
      };
    case 'stipend_desc':
      return (a, b) => {
        const aValue = a.stipend_max ?? a.stipend_min;
        const bValue = b.stipend_max ?? b.stipend_min;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        return bValue - aValue || a.id.localeCompare(b.id);
      };
    case 'company':
      return (a, b) => a.company_name.localeCompare(b.company_name) || a.title.localeCompare(b.title);
    case 'verified':
      return (a, b) => Date.parse(b.last_verified_at) - Date.parse(a.last_verified_at);
    case 'newest':
    default:
      return (a, b) => Date.parse(b.discovered_at) - Date.parse(a.discovered_at);
  }
}

export async function getOverview() {
  await delay();
  return {
    ...overviewData,
    newArrivals: overviewData.newIds
      .map((id) => internships.find((record) => record.id === id))
      .filter(Boolean)
      .map(withLink),
  };
}

export async function listInternships({ q = '', filters = {}, sort = 'newest', page = 1, pageSize = 10 } = {}) {
  await delay();
  const tokens = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const selectedLocations = listify(filters.location);
  const selectedAts = listify(filters.ats);
  const selectedStatuses = listify(filters.status);
  const selectedSkills = listify(filters.skills).map((skill) => String(skill).toLowerCase());
  const selectedDurations = listify(filters.duration).map(Number);
  const minStipend = filters.stipendMin == null || filters.stipendMin === '' ? null : Number(filters.stipendMin);
  const maxStipend = filters.stipendMax == null || filters.stipendMax === '' ? null : Number(filters.stipendMax);
  const postedHours = POSTED_WITHIN_HOURS[String(filters.postedWithin)] || null;

  const filtered = internships.filter((record) => {
    if (tokens.length && !matchesQuery(record, tokens)) return false;
    if (!matchesLocation(record, selectedLocations)) return false;
    if (filters.remote && !record.remote) return false;
    if (selectedAts.length && !selectedAts.includes(record.ats)) return false;
    if (selectedStatuses.length && !selectedStatuses.includes(record.status)) return false;
    if (selectedDurations.length && !selectedDurations.includes(record.duration_months)) return false;
    if (selectedSkills.length && !selectedSkills.every((skill) => (record.skills || []).some((value) => value.toLowerCase() === skill))) return false;
    if (filters.hasDeadline && !record.deadline) return false;
    if (filters.stipendStated && record.stipend_min == null && record.stipend_max == null) return false;
    if (minStipend != null && (record.stipend_max == null || record.stipend_max < minStipend)) return false;
    if (maxStipend != null && (record.stipend_min == null || record.stipend_min > maxStipend)) return false;
    if (postedHours && Date.now() - Date.parse(record.posted_at) > postedHours * 3600000) return false;
    return true;
  });

  filtered.sort(internshipComparator(sort));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  return {
    items: filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize).map(withLink),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    facets: buildFacets(),
  };
}

export async function getInternship(id) {
  await delay();
  const record = internships.find((item) => item.id === id);
  return record ? withLink(record) : null;
}

function sparklineFor(companyId) {
  const bucketMs = 7 * 24 * 3600000;
  const now = Date.now();
  return Array.from({ length: 10 }, (_, index) => {
    const end = now - (9 - index) * bucketMs;
    const start = end - bucketMs;
    return internships.filter((record) => record.company_id === companyId && Date.parse(record.discovered_at) >= start && Date.parse(record.discovered_at) < end).length;
  });
}

function decorateCompany(company) {
  return {
    ...company,
    sample_roles: internships.filter((record) => record.company_id === company.id).length,
    spark: sparklineFor(company.id),
  };
}

export async function listCompanies({ q = '', ats, sort = 'name' } = {}) {
  await delay();
  const tokens = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const selectedAts = listify(ats);
  const result = companies.filter((company) => {
    if (selectedAts.length && !selectedAts.includes(company.ats)) return false;
    return tokens.every((token) => `${company.name} ${company.domain} ${company.ats}`.toLowerCase().includes(token));
  });
  result.sort((a, b) => {
    if (sort === 'roles') return b.open_roles - a.open_roles || a.name.localeCompare(b.name);
    if (sort === 'crawled') return Date.parse(b.last_crawled_at) - Date.parse(a.last_crawled_at);
    return a.name.localeCompare(b.name);
  });
  return result.map(decorateCompany);
}

export async function getCompany(id) {
  await delay();
  const company = companies.find((item) => item.id === id);
  if (!company) return null;
  return {
    ...decorateCompany(company),
    internships: internships
      .filter((record) => record.company_id === id)
      .sort((a, b) => Date.parse(b.discovered_at) - Date.parse(a.discovered_at))
      .map(withLink),
  };
}

export async function getPipeline() {
  await delay();
  return {
    stages: overviewData.stages,
    discovered: overviewData.stages[0].count,
    discarded: overviewData.stages[3].discarded,
    published: overviewData.stages[overviewData.stages.length - 1].count,
    lastCrawlAt: overviewData.lastCrawlAt,
  };
}

export async function listCrawlRuns() {
  await delay();
  return [...crawlRuns].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
}
