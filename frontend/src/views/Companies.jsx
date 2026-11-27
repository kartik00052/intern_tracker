import { useEffect, useMemo, useState } from 'react';
import AtsPill from '../components/AtsPill.jsx';
import Drawer from '../components/Drawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import NotStated from '../components/NotStated.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Sparkline from '../components/Sparkline.jsx';
import StatusDot from '../components/StatusDot.jsx';
import * as api from '../lib/api.js';
import { getSaved, toggleSaved } from '../lib/storage.js';
import { useAsync, useDebouncedValue, useRoute, notify } from '../lib/hooks.js';
import { navigate, splitList } from '../lib/router.js';
import { formatStipend, formatTimestamp, relativeTime } from '../lib/format.js';

const ATS_OPTIONS = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'generic'];

export default function Companies() {
  const route = useRoute();
  const [q, setQ] = useState(route.query.q || '');
  const [ats, setAts] = useState(route.query.ats || '');
  const [sort, setSort] = useState(route.query.sort || 'name');
  const [saved, setSaved] = useState(() => getSaved());
  const debouncedQ = useDebouncedValue(q, 150);
  const baseQueryKey = JSON.stringify({ q: route.query.q, ats: route.query.ats, sort: route.query.sort });

  useEffect(() => {
    setQ(route.query.q || '');
    setAts(route.query.ats || '');
    setSort(route.query.sort || 'name');
  }, [baseQueryKey]);

  const { data: companies, loading, error, reload } = useAsync(
    () => api.listCompanies({ q: debouncedQ, ats, sort }),
    [debouncedQ, ats, sort],
  );
  const { data: company } = useAsync(
    () => (route.id ? api.getCompany(route.id) : Promise.resolve(null)),
    [route.id],
  );
  const internshipId = route.query.internship;
  const internshipState = useAsync(
    () => (internshipId ? api.getInternship(internshipId) : Promise.resolve(null)),
    [internshipId],
  );

  const baseQuery = useMemo(() => {
    const query = {};
    if (q) query.q = q;
    if (ats) query.ats = ats;
    if (sort !== 'name') query.sort = sort;
    return query;
  }, [q, ats, sort]);

  const openCompany = (id) => navigate(`/companies/${id}`, baseQuery);
  const closeCompany = () => navigate('/companies', baseQuery);
  const openInternship = (id) => navigate(`/companies/${route.id}`, { ...baseQuery, internship: id });
  const closeInternship = () => navigate(`/companies/${route.id}`, baseQuery);

  const saveRecord = (id) => {
    const isSaved = toggleSaved(id);
    setSaved(getSaved());
    notify(isSaved ? `${id} saved to your ledger` : `${id} removed from saved`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Source index / companies</span>
          <h1 className="page-title">Companies</h1>
          <p className="page-lede">Boards are grouped by adapter. Counts reflect observed records in the sample dataset.</p>
        </div>
        <div className="toolbar-group">
          <label>
            <span className="sr-only">Search companies</span>
            <input className="input" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or domain" style={{ width: 190 }} />
          </label>
          <label>
            <span className="sr-only">Filter by ATS</span>
            <select className="select" value={ats} onChange={(event) => setAts(event.target.value)}>
              <option value="">All ATS</option>
              {ATS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort companies</span>
            <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Name A–Z</option>
              <option value="roles">Open roles</option>
              <option value="crawled">Recently crawled</option>
            </select>
          </label>
        </div>
      </div>

      <div className="companies-layout">
        <section aria-label="Company index">
          {loading ? (
            <Skeleton rows={9} />
          ) : error ? (
            <EmptyState title="Index unavailable" message="Retry the local company index." action={<button type="button" className="btn" onClick={reload}>Retry</button>} />
          ) : !companies.length ? (
            <EmptyState title="No companies match" message="Try a different ATS provider or search term." />
          ) : (
            <div className="company-list">
              {companies.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`company-row${route.id === item.id ? ' is-active' : ''}`}
                  onClick={() => openCompany(item.id)}
                >
                  <span>
                    <span className="company-name">{item.name}</span>
                    <span className="company-domain" style={{ display: 'block' }}>{item.domain} · crawled {relativeTime(item.last_crawled_at)}</span>
                  </span>
                  <AtsPill ats={item.ats} />
                  <span className="company-number">{item.open_roles} roles</span>
                  <Sparkline values={item.spark} label={`${item.name} discovery trend`} />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="panel company-panel" aria-label="Company detail">
          {company ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">{company.id} / source</span>
                  <h2 className="panel-title">{company.name}</h2>
                </div>
                <button type="button" className="btn btn-sm btn-quiet" onClick={closeCompany}>Close</button>
              </div>
              <div className="panel-body">
                <div className="facts" style={{ marginBottom: 16 }}>
                  <div className="fact-row"><span className="fact-label">Domain</span><span className="fact-leader" /><span className="fact-value">{company.domain}</span></div>
                  <div className="fact-row"><span className="fact-label">Provider</span><span className="fact-leader" /><span className="fact-value"><AtsPill ats={company.ats} /></span></div>
                  <div className="fact-row"><span className="fact-label">Open roles</span><span className="fact-leader" /><span className="fact-value">{company.open_roles}</span></div>
                  <div className="fact-row"><span className="fact-label">Sample roles</span><span className="fact-leader" /><span className="fact-value">{company.sample_roles}</span></div>
                  <div className="fact-row"><span className="fact-label">Last crawl</span><span className="fact-leader" /><span className="fact-value" title={formatTimestamp(company.last_crawled_at)}>{relativeTime(company.last_crawled_at)}</span></div>
                </div>
                <a className="provenance-url" href={company.careers_url} target="_blank" rel="noopener noreferrer">{company.careers_url} ↗</a>
                <div className="section-heading" style={{ marginTop: 18 }}>
                  <h3 className="panel-title">Listings</h3>
                  <span className="eyebrow">{company.internships.length} records</span>
                </div>
                {company.internships.length ? company.internships.map((item) => (
                  <button type="button" className="mini-listing" key={item.id} onClick={() => openInternship(item.id)}>
                    <span className="mini-listing-title">{item.title}</span>
                    <span className="mini-listing-meta">
                      <span>{item.id}</span>
                      <span>{formatStipend(item.stipend_min, item.stipend_max, item.currency) || <NotStated compact />}</span>
                      <StatusDot status={item.status} />
                    </span>
                  </button>
                )) : <p className="company-panel-empty">No sampled internship records for this board.</p>}
              </div>
            </>
          ) : (
            <p className="company-panel-empty">Select a company to inspect its adapter, crawl time and sampled listings.</p>
          )}
        </aside>
      </div>

      {internshipState.data && (
        <Drawer
          record={internshipState.data}
          saved={Boolean(saved[internshipState.data.id])}
          onClose={closeInternship}
          onSave={saveRecord}
        />
      )}
    </div>
  );
}
