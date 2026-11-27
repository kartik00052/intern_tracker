import { useEffect, useState } from 'react';
import CommandBar from './components/CommandBar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import Toast from './components/Toast.jsx';
import Overview from './views/Overview.jsx';
import Internships from './views/Internships.jsx';
import Companies from './views/Companies.jsx';
import Pipeline from './views/Pipeline.jsx';
import Saved from './views/Saved.jsx';
import * as api from './lib/api.js';
import { useAsync, useRoute, useToasts, dismissToast } from './lib/hooks.js';

const VIEWS = {
  overview: Overview,
  internships: Internships,
  companies: Companies,
  pipeline: Pipeline,
  saved: Saved,
};

export default function App() {
  const route = useRoute();
  const { data: overview } = useAsync(() => api.getOverview(), []);
  const toasts = useToasts();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        setPaletteQuery('');
        setPaletteOpen((value) => !value);
        return;
      }
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = document.activeElement;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      event.preventDefault();
      setPaletteQuery('');
      setPaletteOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openPalette = (query = '') => {
    setPaletteQuery(query);
    setPaletteOpen(true);
  };

  const ActiveView = VIEWS[route.name] || Overview;

  return (
    <div className="app-shell">
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >
        Skip to content
      </button>
      <CommandBar active={route.name} onOpenPalette={openPalette} lastCrawlAt={overview?.lastCrawlAt} />
      <main className="main-shell" id="main-content" tabIndex={-1}>
        <ActiveView />
      </main>
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>Internship Intelligence Engine · deterministic record ledger</span>
          <span>Sample dataset · served through src/lib/api.js</span>
          <span>Zero inferred fields · 2026</span>
        </div>
      </footer>
      <CommandPalette open={paletteOpen} initialQuery={paletteQuery} onClose={() => setPaletteOpen(false)} />
      <Toast items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
