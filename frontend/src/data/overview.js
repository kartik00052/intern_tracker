import { internships, linkChecks } from './internships.js';
import { companies } from './companies.js';
import { crawlRuns } from './crawlRuns.js';

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const dayAtOffset = (offset) => new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const discoveredCounts = [42, 51, 38, 64, 57, 49, 72, 45, 53, 61, 36, 58, 47, 66, 40, 55, 62, 44, 59, 70, 48, 52, 37, 63, 56, 74, 43, 60, 68, 71];
const publishedCounts = [31, 39, 28, 49, 44, 37, 55, 34, 41, 47, 27, 45, 36, 51, 30, 43, 48, 33, 46, 54, 36, 40, 28, 49, 43, 57, 33, 46, 52, 55];

const discovery = discoveredCounts.map((discovered, index) => {
  const date = dayAtOffset(index - 29);
  return {
    date,
    label: `${monthNames[Number(date.slice(5, 7)) - 1]} ${date.slice(8)}`,
    discovered,
    published: publishedCounts[index],
  };
});

const statusById = new Map(internships.map((internship) => [internship.id, internship.status]));
const linkHealth = ['live', 'redirected', 'closed', 'dead'].map((status) => {
  const count = linkChecks.filter((check) => statusById.get(check.internship_id) === status).length;
  return {
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percent: Math.round((count / linkChecks.length) * 1000) / 10,
  };
});

const discoveredWithin = (hours) => internships.filter((internship) => Date.now() - Date.parse(internship.discovered_at) <= hours * 60 * 60 * 1000).length;
const newIds = internships
  .filter((internship) => internship.status === 'live')
  .sort((a, b) => Date.parse(b.discovered_at) - Date.parse(a.discovered_at))
  .slice(0, 8)
  .map((internship) => internship.id);
const lastCrawlStarted = crawlRuns.reduce((latest, run) => Math.max(latest, Date.parse(run.started_at)), 0);

export const overviewData = {
  liveCount: 1284,
  totalRecords: 4217,
  verifiedAt: hoursAgo(6),
  lastCrawlAt: new Date(lastCrawlStarted).toISOString(),
  discovered24h: discoveredWithin(24),
  discovered7d: discoveredWithin(24 * 7),
  newCompanies7d: Math.min(companies.length, 6),
  medianVerifyMinutes: 18,
  discovery,
  atsBreakdown: [
    { ats: 'greenhouse', count: 1428, share: 34 },
    { ats: 'lever', count: 927, share: 22 },
    { ats: 'ashby', count: 674, share: 16 },
    { ats: 'smartrecruiters', count: 758, share: 18 },
    { ats: 'generic', count: 430, share: 10 },
  ],
  linkHealth,
  stages: [
    { key: 'discover', name: 'Discover', count: 412, description: 'Found public postings across adapters and job boards.', discarded: 0 },
    { key: 'crawl', name: 'Crawl', count: 389, description: 'Fetched posting pages and ATS payloads.', discarded: 23 },
    { key: 'extract', name: 'Extract', count: 315, description: 'Parsed structured fields from each posting.', discarded: 74 },
    { key: 'normalize', name: 'Normalize', count: 292, description: 'Discarded 97 non-internships while mapping titles, locations, stipends, and skills.', discarded: 23 },
    { key: 'verify', name: 'Verify', count: 264, description: 'Checked application links and freshness signals.', discarded: 28 },
    { key: 'publish', name: 'Publish', count: 251, description: 'Published verified internships to the feed.', discarded: 13 },
  ],
  newIds,
};
