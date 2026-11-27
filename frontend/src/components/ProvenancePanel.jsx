import NotStated from './NotStated.jsx';
import { formatTimestamp } from '../lib/format.js';

export default function ProvenancePanel({ records = [] }) {
  if (!records.length) {
    return <p className="faint mono">No source records attached to this record.</p>;
  }

  return (
    <div>
      {records.map((record, index) => (
        <article className="provenance-source" key={`${record.source}-${index}`}>
          <div className="provenance-top">
            <span className="eyebrow">Source {String(index + 1).padStart(2, '0')}</span>
            <span className="pill">{record.source}</span>
          </div>
          <dl className="facts">
            <div className="fact-row">
              <dt className="fact-label">ATS job ID</dt>
              <span className="fact-leader" aria-hidden="true" />
              <dd className="fact-value">{record.ats_job_id || <NotStated compact />}</dd>
            </div>
            <div className="fact-row">
              <dt className="fact-label">Discovered</dt>
              <span className="fact-leader" aria-hidden="true" />
              <dd className="fact-value">{formatTimestamp(record.discovered_at)}</dd>
            </div>
          </dl>
          <a className="provenance-url" href={record.url} target="_blank" rel="noopener noreferrer">
            {record.url} ↗
          </a>
          <div className="prov-badges" aria-label="Field provenance">
            {Object.entries(record.field_provenance || {}).map(([field, value]) => (
              <span className="prov-badge" data-value={value || 'null'} key={field}>
                <span>{field}</span>
                <strong>{value || 'null'}</strong>
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
