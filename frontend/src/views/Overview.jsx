import BarStrip from '../components/BarStrip.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StatusDot from '../components/StatusDot.jsx';
import * as api from '../lib/api.js';
import { useAsync, useCountUp } from '../lib/hooks.js';
import { navigate } from '../lib/router.js';
import { formatNumber, formatTimestamp, relativeTime } from '../lib/format.js';

export default function Overview() {
  const { data, loading, error, reload } = useAsync(() => api.getOverview(), []);
  const live = useCountUp(data?.liveCount || 0, 760);
  const discovered24 = useCountUp(data?.discovered24h || 0);
  const discovered7 = useCountUp(data?.discovered7d || 0);
  const newCompanies = useCountUp(data?.newCompanies7d || 0);
  const totalRecords = useCountUp(data?.totalRecords || 0, 900);

  if (loading) {
    return (
      <>
        <div className="page-head">
          <div>
            <span className="eyebrow">Overview / live ledger</span>
            <h1 className="page-title">The daily ledger</h1>
          </div>
        </div>
        <Skeleton rows={7} />
      </>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Ledger unavailable"
        message="The overview could not be read. Retry the local data source."
        action={<button type="button" className="btn" onClick={reload}>Retry</button>}
      />
    );
  }

  const maxDiscovery = Math.max(...data.discovery.map((day) => day.discovered));

  return (
    <div className="overview-view">
      <section className="overview-hero" aria-labelledby="overview-heading">
        <h1 className="sr-only" id="overview-heading">Overview of the internship ledger</h1>
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Live records / verified feed</span>
            <div className="hero-number" aria-label={`${formatNumber(data.liveCount)} live internships`}>{formatNumber(live)}</div>
            <p className="hero-unit">live internships, <em>verified {relativeTime(data.verifiedAt)}</em></p>
            <div className="hero-meta">
              <span className="hero-meta-item"><span className="pulse-dot" aria-hidden="true" /> last crawl {relativeTime(data.lastCrawlAt)}</span>
              <span className="hero-meta-item">source of truth: observed records only</span>
              <span className="hero-meta-item">{formatTimestamp(data.lastCrawlAt)}</span>
            </div>
          </div>
          <div className="hero-aside">
            <span className="eyebrow">Reading note</span>
            <p>
              Every field in this ledger traces to a captured source. Missing values stay missing; they are never filled by inference.
            </p>
            <dl>
              <dt>Feed</dt><dd>ATS-first</dd>
              <dt>Sample window</dt><dd>30 days</dd>
              <dt>Record format</dt><dd>immutable</dd>
              <dt>Filters</dt><dd>client-side</dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="metrics-rule" aria-label="Primary metrics">
        <div className="metric-cell">
          <div className="metric-label">Discovered / 24 h</div>
          <div className="metric-value metric-value-serif">{formatNumber(discovered24)}</div>
          <div className="metric-note">new source records</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Discovered / 7 d</div>
          <div className="metric-value">{formatNumber(discovered7)}</div>
          <div className="metric-note">rolling week</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Sources added</div>
          <div className="metric-value">{newCompanies}</div>
          <div className="metric-note">new company boards</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Median verify</div>
          <div className="metric-value">{data.medianVerifyMinutes}<span className="faint"> min</span></div>
          <div className="metric-note">link + freshness check</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Total records</div>
          <div className="metric-value">{formatNumber(totalRecords)}</div>
          <div className="metric-note">all observed postings</div>
        </div>
      </section>

      <div className="chart-grid">
        <section className="panel chart-panel" aria-labelledby="discovery-heading">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Fig. 01 / activity</span>
              <h2 className="panel-title" id="discovery-heading">Discovery timeline</h2>
            </div>
            <span className="eyebrow">postings / day</span>
          </div>
          <div className="chart-body">
            <BarStrip data={data.discovery} onSelect={() => navigate('/internships', { sort: 'newest' })} />
            <p className="chart-summary">
              Amber marks are discovered postings; grey marks are records published after verification. Peak day: {maxDiscovery} discovered.
            </p>
          </div>
        </section>

        <section className="panel chart-panel" aria-labelledby="ats-heading">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Fig. 02 / sources</span>
              <h2 className="panel-title" id="ats-heading">ATS breakdown</h2>
            </div>
            <span className="eyebrow">share of feed</span>
          </div>
          <div className="chart-body">
            <figure>
              <div className="stacked-bar" aria-label="ATS provider share">
                {data.atsBreakdown.map((item) => (
                  <button
                    type="button"
                    className="stack-segment"
                    key={item.ats}
                    style={{ width: `${item.share}%` }}
                    aria-label={`${item.ats}: ${item.share}% of records, ${formatNumber(item.count)} total`}
                  >
                    <span className="chart-tooltip">{item.ats}<br />{item.share}% · {formatNumber(item.count)}</span>
                  </button>
                ))}
              </div>
              <figcaption className="chart-summary">Five adapter families account for the full published feed. Each segment is focusable.</figcaption>
            </figure>
            <div className="legend-list">
              {data.atsBreakdown.map((item) => (
                <div className="legend-row" key={item.ats}>
                  <span className="legend-swatch" aria-hidden="true" />
                  <span>{item.ats}</span>
                  <span className="legend-count">{formatNumber(item.count)} · {item.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="chart-grid ledger-grid">
        <section className="panel chart-panel" aria-labelledby="health-heading">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Fig. 03 / verification</span>
              <h2 className="panel-title" id="health-heading">Link-health ledger</h2>
            </div>
            <span className="eyebrow">sample distribution</span>
          </div>
          <div className="chart-body">
            {data.linkHealth.map((item) => (
              <div className="ledger-row" key={item.status}>
                <span className="ledger-label"><StatusDot status={item.status} label={false} />{item.label}</span>
                <button
                  type="button"
                  className="ledger-track"
                  title={`${item.label}: ${item.count} records, ${item.percent}%`}
                  aria-label={`${item.label}: ${item.count} records, ${item.percent}%`}
                >
                  <span className="ledger-fill" data-status={item.status} style={{ width: `${Math.min(100, item.percent * 2)}%` }} />
                  <span className="chart-tooltip">{item.label}<br />{item.count} · {item.percent}%</span>
                </button>
                <span className="ledger-value">{item.count}</span>
              </div>
            ))}
            <p className="chart-summary">Proportions are scaled within the 54-record sample dataset. Statuses come from observed HTTP checks.</p>
          </div>
        </section>

        <section className="panel chart-panel" aria-labelledby="new-heading">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Latest entries</span>
              <h2 className="panel-title" id="new-heading">Newly discovered</h2>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/internships', { sort: 'newest' })}>Open ledger →</button>
          </div>
          <div>
            {data.newArrivals.map((item, index) => (
              <button
                type="button"
                className="new-record-row"
                key={item.id}
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => navigate(`/internships/${item.id}`)}
              >
                <span className="record-id">{item.id}</span>
                <span className="new-record-title">{item.title} · {item.company_name}</span>
                <span className="faint">{item.location}</span>
                <StatusDot status={item.status} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
