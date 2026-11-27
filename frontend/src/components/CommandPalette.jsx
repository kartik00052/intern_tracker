import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../lib/api.js';
import { navigate } from '../lib/router.js';
import { useDebouncedValue, useFocusTrap } from '../lib/hooks.js';

const COMMANDS = [
  { id: 'cmd-overview', kind: 'command', icon: '01', title: 'Overview', meta: 'front page', path: '/' },
  { id: 'cmd-internships', kind: 'command', icon: '02', title: 'All internships', meta: 'full ledger', path: '/internships' },
  { id: 'cmd-live', kind: 'command', icon: '03', title: 'Live records only', meta: 'filter · status=live', path: '/internships', query: { status: 'live' } },
  { id: 'cmd-remote', kind: 'command', icon: '04', title: 'Remote records only', meta: 'filter · remote=1', path: '/internships', query: { remote: '1' } },
  { id: 'cmd-stipend', kind: 'command', icon: '05', title: 'Stipend stated only', meta: 'filter · stipendStated=1', path: '/internships', query: { stipendStated: '1' } },
  { id: 'cmd-companies', kind: 'command', icon: '06', title: 'Companies index', meta: '24 sources', path: '/companies' },
  { id: 'cmd-pipeline', kind: 'command', icon: '07', title: 'Pipeline', meta: 'crawl runs', path: '/pipeline' },
  { id: 'cmd-saved', kind: 'command', icon: '08', title: 'Saved records', meta: 'local ledger', path: '/saved' },
];

const fuzzy = (text, query) => {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase().trim();
  if (!needle) return true;
  if (haystack.includes(needle)) return true;
  let cursor = 0;
  for (const char of haystack) {
    if (char === needle[cursor]) cursor += 1;
    if (cursor === needle.length) return true;
  }
  return false;
};

export default function CommandPalette({ open, initialQuery = '', onClose }) {
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(0);
  const [results, setResults] = useState({ internships: [], companies: [] });
  useFocusTrap(open, panelRef, onClose);
  const debouncedQuery = useDebouncedValue(query, 120);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setSelected(0);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    Promise.all([
      api.listInternships({ q: debouncedQuery, sort: 'newest', page: 1, pageSize: 6 }),
      api.listCompanies({ q: debouncedQuery }),
    ]).then(([internshipResult, companyList]) => {
      if (active) {
        setResults({
          internships: internshipResult.items,
          companies: companyList.slice(0, 6),
        });
      }
    }).catch(() => {
      if (active) setResults({ internships: [], companies: [] });
    });
    return () => { active = false; };
  }, [open, debouncedQuery]);

  const groups = useMemo(() => {
    const commands = COMMANDS.filter((command) => fuzzy(`${command.title} ${command.meta}`, query));
    const internships = results.internships
      .filter((item) => fuzzy(`${item.id} ${item.title} ${item.company_name}`, query))
      .map((item) => ({
        id: `internship-${item.id}`,
        kind: 'internship',
        icon: 'IR',
        title: `${item.title} · ${item.company_name}`,
        meta: `${item.id} · ${item.ats}`,
        recordId: item.id,
      }));
    const companies = results.companies
      .filter((item) => fuzzy(`${item.name} ${item.domain} ${item.ats}`, query))
      .map((item) => ({
        id: `company-${item.id}`,
        kind: 'company',
        icon: 'CO',
        title: item.name,
        meta: `${item.ats} · ${item.open_roles} roles`,
        recordId: item.id,
      }));
    return [
      { label: 'Commands', items: commands },
      { label: 'Internship records', items: internships },
      { label: 'Companies', items: companies },
    ].filter((group) => group.items.length);
  }, [query, results]);

  const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${selected}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  const run = (item) => {
    if (!item) return;
    if (item.kind === 'internship') navigate(`/internships/${item.recordId}`);
    else if (item.kind === 'company') navigate(`/companies/${item.recordId}`);
    else navigate(item.path, item.query || {});
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((value) => (flatItems.length ? (value + 1) % flatItems.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((value) => (flatItems.length ? (value - 1 + flatItems.length) % flatItems.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(flatItems[selected]);
    }
  };

  let index = -1;

  return (
    <>
      <button type="button" className="palette-backdrop" aria-label="Close command palette" onClick={onClose} />
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" ref={panelRef} tabIndex={-1}>
        <div className="palette-input-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="var(--ink-faint)" strokeWidth="1.2" />
            <path d="M10.5 10.5L14 14" stroke="var(--ink-faint)" strokeWidth="1.2" />
          </svg>
          <input
            className="palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search records, companies, or type a command"
            aria-label="Search records, companies, and commands"
            aria-activedescendant={flatItems.length ? `palette-option-${selected}` : undefined}
            data-autofocus
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="palette-list" ref={listRef} role="listbox" aria-label="Search results">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="palette-group-label">{group.label}</p>
              {group.items.map((item) => {
                index += 1;
                const itemIndex = index;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected === itemIndex}
                    id={`palette-option-${itemIndex}`}
                    data-index={itemIndex}
                    className="palette-item"
                    key={item.id}
                    onMouseEnter={() => setSelected(itemIndex)}
                    onClick={() => run(item)}
                  >
                    <span className="palette-item-icon">{item.icon}</span>
                    <span className="palette-item-title">{item.title}</span>
                    <span className="palette-item-meta">{item.meta}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {!flatItems.length && <p className="palette-group-label">No matches. Try a company, skill, or record ID.</p>}
        </div>
        <div className="palette-footer">
          <span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> move</span>
          <span><kbd className="kbd">↵</kbd> open</span>
          <span><kbd className="kbd">Esc</kbd> close</span>
        </div>
      </section>
    </>
  );
}
