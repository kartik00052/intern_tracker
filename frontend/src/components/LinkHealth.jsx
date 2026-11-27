import NotStated from './NotStated.jsx';
import { formatDate, formatHttpStatus, formatTimestamp } from '../lib/format.js';

const statusForCode = (code) => {
  if (code === 200) return 'live';
  if (code === 301 || code === 302) return 'redirected';
  if (code === 410) return 'closed';
  return 'dead';
};

export default function LinkHealth({ link, status }) {
  if (!link) return <p className="faint mono">No link check recorded.</p>;

  return (
    <div>
      <div className="link-health-grid">
        <div className="link-health-cell">
          <span>Check status</span>
          <strong>{status}</strong>
        </div>
        <div className="link-health-cell">
          <span>HTTP response</span>
          <strong>{formatHttpStatus(link.http_status)}</strong>
        </div>
        <div className="link-health-cell">
          <span>Latency</span>
          <strong>{link.latency_ms} ms</strong>
        </div>
        <div className="link-health-cell">
          <span>Last checked</span>
          <strong>{formatTimestamp(link.checked_at)}</strong>
        </div>
        <div className="link-health-cell" style={{ gridColumn: '1 / -1' }}>
          <span>Redirect target</span>
          <strong>{link.redirect_to ? <a href={link.redirect_to} target="_blank" rel="noopener noreferrer">{link.redirect_to}</a> : <NotStated compact />}</strong>
        </div>
      </div>
      <div className="history-strip" role="img" aria-label={`Recent link checks: ${link.history.map((entry) => formatHttpStatus(entry.status)).join(', ')}`}>
        {link.history.map((entry, index) => (
          <span
            key={`${entry.checked_at}-${index}`}
            className="history-cell"
            data-status={statusForCode(entry.status)}
            title={`${formatHttpStatus(entry.status)} · ${formatDate(entry.checked_at)}`}
          />
        ))}
      </div>
      <p className="chart-summary">Oldest check left, newest check right. Every bar reflects an observed response, not an inferred state.</p>
    </div>
  );
}
