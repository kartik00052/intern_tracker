import AtsPill from './AtsPill.jsx';
import NotStated from './NotStated.jsx';
import StatusDot from './StatusDot.jsx';
import { deadlineInfo, formatStipend } from '../lib/format.js';

function StarButton({ saved, onClick, label }) {
  return (
    <button
      type="button"
      className={`icon-btn star-btn${saved ? ' is-saved' : ''}`}
      aria-label={label}
      aria-pressed={saved}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" fill={saved ? 'currentColor' : 'none'}>
        <path d="M10 2.4l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L2.5 7.9l5.2-.8L10 2.4z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
  );
}

function DeadlineCell({ value }) {
  const info = deadlineInfo(value);
  if (!info) return <NotStated compact />;
  return (
    <span className={`deadline-${info.urgency}`} title={info.absolute}>
      {info.label}
    </span>
  );
}

export default function ResultsTable({
  items = [],
  view = 'table',
  saved = {},
  activeIndex = -1,
  onOpen,
  onSave,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  onPage,
  onPageSize,
}) {
  const open = (id) => onOpen(id);
  const setActive = (index) => {
    const rows = document.querySelectorAll('[data-result-index]');
    rows.forEach((row) => row.classList.toggle('is-active', Number(row.getAttribute('data-result-index')) === index));
  };

  return (
    <>
      {view === 'table' ? (
        <div className="table-wrap">
          <table className="results-table">
            <caption className="sr-only">Internship records. Use J and K to move, Enter to open, and S to save.</caption>
            <thead>
              <tr>
                <th scope="col">Record ID</th>
                <th scope="col">Role / Company</th>
                <th scope="col">Location</th>
                <th scope="col">Stipend</th>
                <th scope="col">Deadline</th>
                <th scope="col">ATS</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Saved</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  data-result-index={index}
                  className={index === activeIndex ? 'is-active' : ''}
                  onMouseEnter={() => setActive(index)}
                  onClick={(event) => {
                    if (event.target.closest('button')) return;
                    open(item.id);
                  }}
                >
                  <th scope="row" className="record-id">{item.id}</th>
                  <td className="role-cell">
                    <button type="button" className="row-link" onClick={() => open(item.id)}>
                      <strong>{item.title}</strong>
                    </button>
                    <span>{item.company_name}</span>
                  </td>
                  <td>
                    {item.location}
                    {item.remote && <span className="remote-tag">remote</span>}
                  </td>
                  <td>{formatStipend(item.stipend_min, item.stipend_max, item.currency) || <NotStated compact />}</td>
                  <td><DeadlineCell value={item.deadline} /></td>
                  <td><AtsPill ats={item.ats} /></td>
                  <td><StatusDot status={item.status} /></td>
                  <td>
                    <StarButton saved={Boolean(saved[item.id])} onClick={() => onSave(item.id)} label={saved[item.id] ? `Remove ${item.id} from saved` : `Save ${item.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="comfortable-list">
          {items.map((item, index) => (
            <article
              key={item.id}
              data-result-index={index}
              className={`comfortable-row${index === activeIndex ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
            >
              <button type="button" className="comfortable-open" onClick={() => open(item.id)}>
                <span className="eyebrow">{item.id} / {item.ats}</span>
                <span className="comfortable-title">{item.title}</span>
                <span className="comfortable-meta">
                  <span>{item.company_name}</span>
                  <span>{item.location}</span>
                  <span>{formatStipend(item.stipend_min, item.stipend_max, item.currency) || <NotStated compact />}</span>
                  <DeadlineCell value={item.deadline} />
                </span>
              </button>
              <div className="comfortable-side">
                <StatusDot status={item.status} label={false} />
                <StarButton saved={Boolean(saved[item.id])} onClick={() => onSave(item.id)} label={saved[item.id] ? `Remove ${item.id} from saved` : `Save ${item.id}`} />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="pagination">
        <div className="pagination-controls">
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
          <span className="page-number" aria-live="polite">Page {page} / {totalPages}</span>
          <button type="button" className="btn btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
        </div>
        <label className="toolbar-group">
          <span className="eyebrow">Rows</span>
          <select
            className="select page-size"
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            aria-label="Rows per page"
          >
            {[10, 20, 30].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
    </>
  );
}
