import { useEffect, useMemo, useState } from 'react';
import Drawer from '../components/Drawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FilterRail from '../components/FilterRail.jsx';
import ResultsTable from '../components/ResultsTable.jsx';
import Skeleton from '../components/Skeleton.jsx';
import * as api from '../lib/api.js';
import {
  getLastFilters,
  getPrefs,
  getSaved,
  setLastFilters,
  setPrefs,
  toggleSaved,
} from '../lib/storage.js';
import { useAsync, useCountUp, useDebouncedValue, useRoute, notify } from '../lib/hooks.js';
import { buildHash, navigate, splitList } from '../lib/router.js';
import { formatNumber } from '../lib/format.js';

const EMPTY_FILTERS = {
  location: [],
  remote: false,
  ats: [],
  status: [],
  stipendMin: null,
  stipendMax: null,
  duration: [],
  postedWithin: '',
  skills: [],
  hasDeadline: false,
  stipendStated: false,
};

const SORTS = [
  ['newest', 'Newest discovered'],
  ['deadline', 'Deadline soonest'],
  ['stipend_desc', 'Stipend high → low'],
  ['company', 'Company A–Z'],
  ['verified', 'Recently verified'],
];

function filtersFromQuery(query = {}) {
  return {
    ...EMPTY_FILTERS,
    location: splitList(query.location),
    remote: query.remote === '1' || query.remote === 'true',
    ats: splitList(query.ats),
    status: splitList(query.status),
    stipendMin: query.stipendMin ? Number(query.stipendMin) : null,
    stipendMax: query.stipendMax ? Number(query.stipendMax) : null,
    duration: splitList(query.duration).map(Number),
    postedWithin: query.postedWithin || '',
    skills: splitList(query.skills),
    hasDeadline: query.hasDeadline === '1' || query.hasDeadline === 'true',
    stipendStated: query.stipendStated === '1' || query.stipendStated === 'true',
  };
}

function filtersToQuery(filters, q, sort) {
  const query = {};
  if (q) query.q = q;
  if (filters.location.length) query.location = filters.location.join(',');
  if (filters.remote) query.remote = '1';
  if (filters.ats.length) query.ats = filters.ats.join(',');
  if (filters.status.length) query.status = filters.status.join(',');
  if (filters.stipendMin != null) query.stipendMin = filters.stipendMin;
  if (filters.stipendMax != null) query.stipendMax = filters.stipendMax;
  if (filters.duration.length) query.duration = filters.duration.join(',');
  if (filters.postedWithin) query.postedWithin = filters.postedWithin;
  if (filters.skills.length) query.skills = filters.skills.join(',');
  if (filters.hasDeadline) query.hasDeadline = '1';
  if (filters.stipendStated) query.stipendStated = '1';
  if (sort !== 'newest') query.sort = sort;
  return query;
}

function prettyFilter(value) {
  return value.replace(/^(loc|city):/, '');
}

export default function Internships() {
  const route = useRoute();
  const initialPrefs = useMemo(() => getPrefs(), []);
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, ...getLastFilters() }));
  const [q, setQ] = useState(route.query.q || '');
  const [sort, setSort] = useState(initialPrefs.sort);
  const [viewMode, setViewMode] = useState(initialPrefs.view);
  const [railCollapsed, setRailCollapsed] = useState(initialPrefs.railCollapsed);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPrefs.pageSize);
  const [saved, setSaved] = useState(() => getSaved());
  const [activeIndex, setActiveIndex] = useState(0);

  const queryKey = JSON.stringify(route.query);
  const filtersKey = JSON.stringify(filters);
  const debouncedQ = useDebouncedValue(q, 180);

  useEffect(() => {
    if (!route.query || Object.keys(route.query).length === 0) return;
    setFilters(filtersFromQuery(route.query));
    setQ(route.query.q || '');
    if (route.query.sort) setSort(route.query.sort);
    setPage(1);
  }, [queryKey]);

  useEffect(() => {
    setLastFilters(filters);
  }, [filtersKey]);

  useEffect(() => {
    setPrefs({ view: viewMode, railCollapsed, sort, pageSize });
  }, [viewMode, railCollapsed, sort, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filtersKey, sort, pageSize]);

  const { data, loading, error, reload } = useAsync(
    () => api.listInternships({ q: debouncedQ, filters, sort, page, pageSize }),
    [debouncedQ, filtersKey, sort, page, pageSize],
  );

  const selectedState = useAsync(
    () => (route.id ? api.getInternship(route.id) : Promise.resolve(null)),
    [route.id],
  );

  const animatedTotal = useCountUp(data?.total || 0, 420);

  useEffect(() => {
    document.querySelector(`[data-result-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (data && activeIndex >= data.items.length) setActiveIndex(0);
  }, [data, activeIndex]);

  const openRecord = (id) => navigate(`/internships/${id}`, filtersToQuery(filters, q, sort));
  const closeRecord = () => navigate('/internships', filtersToQuery(filters, q, sort));
  const currentQuery = filtersToQuery(filters, q, sort);

  const saveRecord = (id) => {
    const isSaved = toggleSaved(id);
    setSaved(getSaved());
    notify(isSaved ? `${id} saved to your ledger` : `${id} removed from saved`);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || route.id) return;
      const target = document.activeElement;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      const total = data?.items.length || 0;
      if (event.key === 'j' || event.key === 'J') {
        event.preventDefault();
        setActiveIndex((value) => (total ? Math.min(total - 1, value + 1) : 0));
      } else if (event.key === 'k' || event.key === 'K') {
        event.preventDefault();
        setActiveIndex((value) => (total ? Math.max(0, value - 1) : 0));
      } else if (event.key === 'Enter' && total) {
        event.preventDefault();
        openRecord(data.items[activeIndex]?.id);
      } else if (event.key.toLowerCase() === 's' && total) {
        event.preventDefault();
        saveRecord(data.items[activeIndex]?.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [data, activeIndex, route.id, filtersKey, q, sort]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (q) chips.push({ key: 'q', label: `search: ${q}`, clear: () => setQ('') });
    filters.location.forEach((value) => chips.push({ key: `loc-${value}`, label: prettyFilter(value), clear: () => setFilters((current) => ({ ...current, location: current.location.filter((item) => item !== value) })) }));
    if (filters.remote) chips.push({ key: 'remote', label: 'remote only', clear: () => setFilters((current) => ({ ...current, remote: false })) });
    filters.ats.forEach((value) => chips.push({ key: `ats-${value}`, label: `ats: ${value}`, clear: () => setFilters((current) => ({ ...current, ats: current.ats.filter((item) => item !== value) })) }));
    filters.status.forEach((value) => chips.push({ key: `status-${value}`, label: `status: ${value}`, clear: () => setFilters((current) => ({ ...current, status: current.status.filter((item) => item !== value) })) }));
    if (filters.stipendMin != null) chips.push({ key: 'min', label: `min ${filters.stipendMin}`, clear: () => setFilters((current) => ({ ...current, stipendMin: null })) });
    if (filters.stipendMax != null) chips.push({ key: 'max', label: `max ${filters.stipendMax}`, clear: () => setFilters((current) => ({ ...current, stipendMax: null })) });
    filters.duration.forEach((value) => chips.push({ key: `duration-${value}`, label: `${value} mo`, clear: () => setFilters((current) => ({ ...current, duration: current.duration.filter((item) => item !== value) })) }));
    if (filters.postedWithin) chips.push({ key: 'posted', label: `posted ≤ ${filters.postedWithin}`, clear: () => setFilters((current) => ({ ...current, postedWithin: '' })) });
    filters.skills.forEach((value) => chips.push({ key: `skill-${value}`, label: `skill: ${value}`, clear: () => setFilters((current) => ({ ...current, skills: current.skills.filter((item) => item !== value) })) }));
    if (filters.hasDeadline) chips.push({ key: 'deadline', label: 'has deadline', clear: () => setFilters((current) => ({ ...current, hasDeadline: false })) });
    if (filters.stipendStated) chips.push({ key: 'stated', label: 'stipend stated', clear: () => setFilters((current) => ({ ...current, stipendStated: false })) });
    return chips;
  }, [q, filtersKey]);

  const clearAll = () => {
    setQ('');
    setFilters(EMPTY_FILTERS);
    navigate('/internships', {}, { replace: true });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Core ledger / internships</span>
          <h1 className="page-title">Internships</h1>
          <p className="page-lede">Every row is an observed record with a source trail. Absent fields remain visibly absent.</p>
        </div>
        <div className="help-hints" aria-label="Keyboard shortcuts">
          <span><kbd className="kbd">/</kbd> palette</span>
          <span><kbd className="kbd">J</kbd><kbd className="kbd">K</kbd> rows</span>
          <span><kbd className="kbd">↵</kbd> open</span>
          <span><kbd className="kbd">S</kbd> save</span>
        </div>
      </div>

      <div className={`internships-layout${railCollapsed ? ' is-rail-collapsed' : ''}`}>
        <FilterRail
          filters={filters}
          facets={data?.facets || { locations: [], cities: [], ats: [], statuses: [], skills: [], duration: [] }}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((value) => !value)}
          onChange={setFilters}
          onReset={clearAll}
        />

        <section className="results-column" aria-label="Internship results">
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <span className="sr-only">Search internships</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <input
                  className="input"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search title, company, skill, ID"
                />
              </label>
              <label>
                <span className="sr-only">Sort results</span>
                <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
                  {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="toolbar-group">
              <span className="result-count" aria-live="polite"><strong>{formatNumber(animatedTotal)}</strong> records</span>
              <div className="view-toggle" role="group" aria-label="Result density">
                <button type="button" aria-label="Dense table view" aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')}>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3h12M2 7h12M2 11h12M2 15h12" stroke="currentColor" /></svg>
                </button>
                <button type="button" aria-label="Comfortable list view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="5" stroke="currentColor" /><rect x="2" y="9" width="12" height="5" stroke="currentColor" /></svg>
                </button>
              </div>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-filters" aria-label="Active filters">
              {activeChips.map((chip) => (
                <span className="filter-chip" key={chip.key}>
                  {chip.label}
                  <button type="button" aria-label={`Remove ${chip.label} filter`} onClick={chip.clear}>×</button>
                </span>
              ))}
              <button type="button" className="btn btn-quiet btn-sm" onClick={clearAll}>Clear all</button>
            </div>
          )}

          {loading ? (
            <Skeleton rows={Math.min(pageSize, 8)} />
          ) : error ? (
            <EmptyState
              title="Ledger read failed"
              message="The internship records could not be loaded. Retry the local data source."
              action={<button type="button" className="btn" onClick={reload}>Retry</button>}
            />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="No records under these filters"
              message="Each filter narrows only observed fields. Clear one to widen the ledger."
              action={<button type="button" className="btn" onClick={clearAll}>Clear filters</button>}
            />
          ) : (
            <ResultsTable
              items={data.items}
              view={viewMode}
              saved={saved}
              activeIndex={activeIndex}
              onOpen={openRecord}
              onSave={saveRecord}
              page={data.page}
              totalPages={data.totalPages}
              pageSize={data.pageSize}
              onPage={(next) => setPage(next)}
              onPageSize={(size) => setPageSize(size)}
            />
          )}
          <p className="results-footer-note">
            Deep link: <code>{buildHash(`/internships/${data?.items[activeIndex]?.id || 'INT-00421'}`, currentQuery)}</code>
          </p>
        </section>
      </div>

      {route.id && selectedState.data && (
        <Drawer
          record={selectedState.data}
          saved={Boolean(saved[selectedState.data.id])}
          onClose={closeRecord}
          onSave={saveRecord}
        />
      )}
      {route.id && !selectedState.loading && !selectedState.data && (
        <EmptyState
          title="Record not in this ledger"
          message={`${route.id} was not found in the sample dataset.`}
          action={<button type="button" className="btn" onClick={closeRecord}>Back to results</button>}
        />
      )}
    </div>
  );
}
