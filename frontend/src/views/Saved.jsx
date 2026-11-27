import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import NotStated from '../components/NotStated.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StatusDot from '../components/StatusDot.jsx';
import * as api from '../lib/api.js';
import {
  clearSaved,
  getSaved,
  removeSaved,
  savedStatuses,
  updateSavedMeta,
} from '../lib/storage.js';
import { useAsync, notify } from '../lib/hooks.js';
import { navigate } from '../lib/router.js';
import { formatStipend, toCsv } from '../lib/format.js';

export default function Saved() {
  const [meta, setMeta] = useState(() => getSaved());
  const [confirming, setConfirming] = useState(false);
  const idsKey = Object.keys(meta).sort().join(',');
  const { data, loading, error, reload } = useAsync(async () => {
    if (!idsKey) return [];
    const records = await Promise.all(idsKey.split(',').map((id) => api.getInternship(id)));
    return records.filter(Boolean);
  }, [idsKey]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(savedStatuses.map((status) => [status, 0]));
    Object.values(meta).forEach((item) => {
      if (result[item.status] != null) result[item.status] += 1;
    });
    return result;
  }, [meta]);

  const refresh = () => setMeta(getSaved());

  const updateMeta = (id, patch) => {
    updateSavedMeta(id, patch);
    refresh();
  };

  const remove = (id) => {
    removeSaved(id);
    refresh();
    notify(`${id} removed from saved`);
  };

  const exportCsv = () => {
    const rows = [
      ['Record ID', 'Title', 'Company', 'Location', 'Stipend', 'Status', 'Deadline', 'Source URL', 'Note'],
      ...(data || []).map((record) => [
        record.id,
        record.title,
        record.company_name,
        record.location,
        formatStipend(record.stipend_min, record.stipend_max, record.currency) || 'Not stated',
        meta[record.id]?.status || 'Interested',
        record.deadline || 'Not stated',
        record.apply_url,
        meta[record.id]?.note || '',
      ]),
    ];
    const blob = new Blob([`\ufeff${toCsv(rows)}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'internship-ledger-saved.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notify(`${data.length} saved records exported`);
  };

  const clearAll = () => {
    clearSaved();
    setConfirming(false);
    refresh();
    notify('Saved ledger cleared');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Private ledger / local storage</span>
          <h1 className="page-title">Saved</h1>
          <p className="page-lede">Bookmarks, notes and pipeline states stay in this browser. No account, no server, no sync.</p>
        </div>
        <div className="toolbar-group">
          <button type="button" className="btn" onClick={exportCsv} disabled={!data?.length}>Export CSV</button>
          <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)} disabled={!idsKey}>Clear all</button>
        </div>
      </div>

      <section className="saved-summary" aria-label="Saved status counts">
        {savedStatuses.map((status) => (
          <div className="saved-summary-cell" key={status}>
            <span className="metric-label">{status}</span>
            <strong>{counts[status]}</strong>
          </div>
        ))}
      </section>

      {confirming && (
        <div className="confirm-bar" role="alert">
          <span>Clear all saved records and notes? This cannot be undone.</span>
          <span className="toolbar-group">
            <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={clearAll}>Confirm clear</button>
          </span>
        </div>
      )}

      {loading ? (
        <Skeleton rows={5} />
      ) : error ? (
        <EmptyState title="Saved records unavailable" message="Retry reading these records from the local data source." action={<button type="button" className="btn" onClick={reload}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState
          title="Nothing saved yet"
          message="Use the star on any internship row to place a record in this local ledger."
          action={<button type="button" className="btn" onClick={() => navigate('/internships')}>Browse internships</button>}
        />
      ) : (
        <div className="saved-list">
          {data.map((record, index) => (
            <article className="saved-item" key={record.id} style={{ animationDelay: `${index * 40}ms` }}>
              <div>
                <button type="button" className="row-link" onClick={() => navigate(`/internships/${record.id}`)}>
                  <span className="saved-item-title">{record.title}</span>
                </button>
                <p className="saved-item-meta">
                  {record.id} · {record.company_name} · {record.location} · <StatusDot status={record.status} />
                </p>
                <p className="saved-item-meta">
                  {formatStipend(record.stipend_min, record.stipend_max, record.currency) || <NotStated compact />}
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor={`note-${record.id}`}>Research note</label>
                <textarea
                  id={`note-${record.id}`}
                  className="textarea"
                  value={meta[record.id]?.note || ''}
                  placeholder="Add a private note about this record"
                  onChange={(event) => updateMeta(record.id, { note: event.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`status-${record.id}`}>Status</label>
                <select
                  id={`status-${record.id}`}
                  className="select status-select"
                  value={meta[record.id]?.status || 'Interested'}
                  onChange={(event) => {
                    updateMeta(record.id, { status: event.target.value });
                    notify(`${record.id} marked ${event.target.value}`);
                  }}
                >
                  {savedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <button type="button" className="icon-btn" aria-label={`Remove ${record.id} from saved`} onClick={() => remove(record.id)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" fill="none" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
