import { formatStipend } from '../lib/format.js';

function toggleValue(values, value) {
  const list = Array.isArray(values) ? values : [];
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function CheckGroup({ title, options = [], selected = [], onToggle }) {
  return (
    <section className="filter-section">
      <h3 className="filter-section-title">{title}</h3>
      <div className="filter-options">
        {options.map((option) => (
          <label className="check-item" key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
            <span className="check-count">{option.count}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export default function FilterRail({ filters, facets, collapsed, onToggleCollapse, onChange, onReset }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const min = filters.stipendMin == null ? 0 : Number(filters.stipendMin);
  const max = filters.stipendMax == null ? 100000 : Number(filters.stipendMax);

  return (
    <aside className={`filter-rail${collapsed ? ' is-collapsed' : ''}`} aria-label="Internship filters">
      <div className="filter-rail-head">
        <span className="eyebrow filter-rail-label">Filters</span>
        <button
          type="button"
          className="icon-btn"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
          onClick={onToggleCollapse}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {collapsed ? <path d="M6 3l5 5-5 5" /> : <path d="M10 3L5 8l5 5" />}
            <path d="M2 3v10" />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="filter-rail-body">
          <CheckGroup
            title="Location"
            options={facets.locations}
            selected={filters.location}
            onToggle={(value) => update('location', toggleValue(filters.location, value))}
          />
          <CheckGroup
            title="City"
            options={facets.cities}
            selected={filters.location}
            onToggle={(value) => update('location', toggleValue(filters.location, value))}
          />
          <section className="filter-section">
            <div className="switch-row">
              <span>Remote only</span>
              <label className="switch">
                <input type="checkbox" checked={Boolean(filters.remote)} onChange={(event) => update('remote', event.target.checked)} />
                <span className="switch-track" />
                <span className="sr-only">Remote only</span>
              </label>
            </div>
          </section>
          <CheckGroup
            title="ATS provider"
            options={facets.ats}
            selected={filters.ats}
            onToggle={(value) => update('ats', toggleValue(filters.ats, value))}
          />
          <section className="filter-section">
            <h3 className="filter-section-title">Link status</h3>
            {facets.statuses.map((option) => (
              <label className="check-item" key={option.value}>
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => update('status', toggleValue(filters.status, option.value))}
                />
                <span className="status-dot" data-status={option.value} aria-hidden="true" />
                <span>{option.label}</span>
                <span className="check-count">{option.count}</span>
              </label>
            ))}
          </section>
          <section className="filter-section">
            <h3 className="filter-section-title">Stipend / month</h3>
            <label className="field-label" htmlFor="stipend-min">Floor</label>
            <div className="range-row">
              <input
                id="stipend-min"
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={min}
                onChange={(event) => update('stipendMin', Number(event.target.value) || null)}
              />
            </div>
            <label className="field-label" htmlFor="stipend-max" style={{ marginTop: 8 }}>Ceiling</label>
            <div className="range-row">
              <input
                id="stipend-max"
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={max}
                onChange={(event) => update('stipendMax', Number(event.target.value) || null)}
              />
            </div>
            <div className="range-values">
              <span>{filters.stipendMin == null ? 'any' : formatStipend(min, min, 'INR')}</span>
              <span>{filters.stipendMax == null || max >= 100000 ? 'any' : formatStipend(max, max, 'INR')}</span>
            </div>
            <label className="check-item" style={{ marginTop: 9 }}>
              <input
                type="checkbox"
                checked={Boolean(filters.stipendStated)}
                onChange={(event) => update('stipendStated', event.target.checked)}
              />
              <span>Stipend stated only</span>
            </label>
          </section>
          <CheckGroup
            title="Duration"
            options={facets.duration}
            selected={filters.duration}
            onToggle={(value) => update('duration', toggleValue(filters.duration, value))}
          />
          <section className="filter-section">
            <h3 className="filter-section-title">Posted within</h3>
            <div className="segmented-options">
              {[['24', '24h'], ['7', '7d'], ['30', '30d']].map(([value, label]) => (
                <button
                  type="button"
                  className="btn btn-sm"
                  key={value}
                  aria-pressed={filters.postedWithin === value}
                  onClick={() => update('postedWithin', filters.postedWithin === value ? '' : value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
          <CheckGroup
            title="Skills"
            options={facets.skills}
            selected={filters.skills}
            onToggle={(value) => update('skills', toggleValue(filters.skills, value))}
          />
          <section className="filter-section">
            <div className="switch-row">
              <span>Has deadline</span>
              <label className="switch">
                <input type="checkbox" checked={Boolean(filters.hasDeadline)} onChange={(event) => update('hasDeadline', event.target.checked)} />
                <span className="switch-track" />
                <span className="sr-only">Has deadline</span>
              </label>
            </div>
          </section>
          <button type="button" className="btn btn-quiet" style={{ width: '100%' }} onClick={onReset}>
            Clear all filters
          </button>
        </div>
      )}
    </aside>
  );
}
