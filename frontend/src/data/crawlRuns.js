const startedHoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const crawlRuns = [
  { id: 'RUN-0151', adapter: 'greenhouse', target: 'Stripe', started_at: startedHoursAgo(164), duration_s: 184, status: 'success', discovered: 38, new: 12, errors: 0, error_detail: null },
  { id: 'RUN-0152', adapter: 'lever', target: 'Postman', started_at: startedHoursAgo(151), duration_s: 121, status: 'success', discovered: 24, new: 7, errors: 0, error_detail: null },
  { id: 'RUN-0153', adapter: 'ashby', target: 'Notion', started_at: startedHoursAgo(139), duration_s: 96, status: 'partial', discovered: 31, new: 9, errors: 3, error_detail: 'Ashby cursor skipped 3 expired requisitions' },
  { id: 'RUN-0154', adapter: 'smartrecruiters', target: 'Innovaccer', started_at: startedHoursAgo(126), duration_s: 208, status: 'success', discovered: 45, new: 14, errors: 0, error_detail: null },
  { id: 'RUN-0155', adapter: 'generic', target: 'Figma', started_at: startedHoursAgo(114), duration_s: 74, status: 'success', discovered: 19, new: 5, errors: 0, error_detail: null },
  { id: 'RUN-0156', adapter: 'greenhouse', target: 'Databricks', started_at: startedHoursAgo(101), duration_s: 156, status: 'partial', discovered: 52, new: 18, errors: 5, error_detail: 'Greenhouse cursor halted after rate-limit response 429' },
  { id: 'RUN-0157', adapter: 'lever', target: 'CRED', started_at: startedHoursAgo(88), duration_s: 88, status: 'partial', discovered: 27, new: 6, errors: 2, error_detail: 'Lever response missing salary metadata for 2 jobs' },
  { id: 'RUN-0158', adapter: 'ashby', target: 'Linear', started_at: startedHoursAgo(76), duration_s: 63, status: 'success', discovered: 16, new: 4, errors: 0, error_detail: null },
  { id: 'RUN-0159', adapter: 'smartrecruiters', target: 'Barclays', started_at: startedHoursAgo(64), duration_s: 245, status: 'failed', discovered: 0, new: 0, errors: 9, error_detail: 'SmartRecruiters login challenge blocked session' },
  { id: 'RUN-0160', adapter: 'generic', target: 'Adobe', started_at: startedHoursAgo(52), duration_s: 132, status: 'success', discovered: 29, new: 8, errors: 0, error_detail: null },
  { id: 'RUN-0161', adapter: 'greenhouse', target: 'Swiggy', started_at: startedHoursAgo(40), duration_s: 171, status: 'success', discovered: 41, new: 13, errors: 0, error_detail: null },
  { id: 'RUN-0162', adapter: 'ashby', target: 'Airtable', started_at: startedHoursAgo(28), duration_s: 81, status: 'success', discovered: 22, new: 6, errors: 0, error_detail: null },
  { id: 'RUN-0163', adapter: 'generic', target: 'Zoho', started_at: startedHoursAgo(18), duration_s: 119, status: 'partial', discovered: 35, new: 10, errors: 4, error_detail: 'Generic parser timed out on 4 dynamic pages' },
  { id: 'RUN-0164', adapter: 'smartrecruiters', target: 'Groww', started_at: startedHoursAgo(9), duration_s: 143, status: 'success', discovered: 33, new: 11, errors: 0, error_detail: null },
  { id: 'RUN-0165', adapter: 'greenhouse', target: 'BrowserStack', started_at: startedHoursAgo(2), duration_s: 167, status: 'success', discovered: 37, new: 12, errors: 0, error_detail: null },
];
