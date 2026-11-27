import { navigate } from '../lib/router.js';
import { relativeTime } from '../lib/format.js';

const NAV = [
  { name: 'overview', label: 'Overview', path: '/' },
  { name: 'internships', label: 'Internships', path: '/internships' },
  { name: 'companies', label: 'Companies', path: '/companies' },
  { name: 'pipeline', label: 'Pipeline', path: '/pipeline' },
  { name: 'saved', label: 'Saved', path: '/saved' },
];

const ICONS = {
  overview: 'M3 12l9-8 9 8M5 11v9h14v-9M9 20v-6h6v6',
  internships: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  companies: 'M4 20V6l8-3 8 3v14M8 20v-5h3v5M13 20v-8h3v8',
  pipeline: 'M3 8h5l3-4 3 8 3-4h4M3 16h18',
  saved: 'M6 3h12v18l-6-4-6 4z',
};

export default function CommandBar({ active, onOpenPalette, lastCrawlAt }) {
  return (
    <>
      <header className="command-bar">
        <div className="command-bar-inner">
          <a
            className="brand"
            href="#/"
            aria-label="Internship Intelligence home"
            onClick={(event) => {
              event.preventDefault();
              navigate('/');
            }}
          >
            <span className="brand-mark" aria-hidden="true">II</span>
            <span className="brand-name">
              <span className="brand-long">Internship Intelligence</span>
              <span className="brand-short">The Ledger</span>
            </span>
            <span className="brand-sub">The Ledger</span>
          </a>

          <nav className="nav-tabs" aria-label="Primary navigation">
            {NAV.map((item) => (
              <button
                type="button"
                key={item.name}
                className="nav-tab"
                aria-current={active === item.name ? 'page' : undefined}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button type="button" className="command-search" onClick={() => onOpenPalette('')} aria-label="Open command palette">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="command-search-label">Search records, companies, commands</span>
            <kbd className="kbd">/</kbd>
          </button>

          <div className="live-status" title={lastCrawlAt ? `Last crawl ${lastCrawlAt}` : 'Loading crawl status'}>
            <span className="pulse-dot" aria-hidden="true" />
            <span>crawl {lastCrawlAt ? relativeTime(lastCrawlAt) : 'syncing'}</span>
          </div>
        </div>
      </header>

      <nav className="mobile-tabs" aria-label="Mobile navigation">
        {NAV.map((item) => (
          <button
            type="button"
            key={item.name}
            className="mobile-tab"
            aria-current={active === item.name ? 'page' : undefined}
            onClick={() => navigate(item.path)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d={ICONS[item.name]} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
