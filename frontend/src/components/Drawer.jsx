import { useRef } from 'react';
import AtsPill from './AtsPill.jsx';
import LinkHealth from './LinkHealth.jsx';
import NotStated from './NotStated.jsx';
import ProvenancePanel from './ProvenancePanel.jsx';
import StatusDot from './StatusDot.jsx';
import { useFocusTrap, notify } from '../lib/hooks.js';
import {
  deadlineInfo,
  formatDuration,
  formatStipend,
  formatTimestamp,
  relativeTime,
} from '../lib/format.js';

function Fact({ label, children }) {
  return (
    <div className="fact-row">
      <span className="fact-label">{label}</span>
      <span className="fact-leader" aria-hidden="true" />
      <span className="fact-value">{children}</span>
    </div>
  );
}

export default function Drawer({ record, saved, onClose, onSave }) {
  const panelRef = useRef(null);
  useFocusTrap(Boolean(record), panelRef, onClose);

  if (!record) return null;

  const deadline = deadlineInfo(record.deadline);
  const stipend = formatStipend(record.stipend_min, record.stipend_max, record.currency);

  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(message);
    } catch {
      notify('Clipboard unavailable in this browser');
    }
  };

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close record details" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" ref={panelRef} tabIndex={-1}>
        <div className="drawer-inner">
          <div className="drawer-grip">
            <span className="sr-only">Swipe down or use the close button to dismiss</span>
            <button type="button" className="icon-btn" aria-label="Close record details" onClick={onClose} data-autofocus>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
          </div>

          <header className="drawer-header">
            <div>
              <div className="eyebrow">{record.id} / verified record</div>
              <h2 className="drawer-title" id="drawer-title">{record.title}</h2>
              <p className="drawer-company">{record.company_name} · {record.location}</p>
            </div>
            <button type="button" className="icon-btn" aria-label="Close record details" onClick={onClose} data-autofocus>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </header>

          <div className="drawer-actions">
            <a className="btn btn-primary" href={record.apply_url} target="_blank" rel="noopener noreferrer">
              Apply / open source ↗
            </a>
            <button type="button" className="btn" onClick={() => onSave(record.id)} aria-pressed={saved}>
              {saved ? 'Saved' : 'Save record'}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => copy(record.apply_url, 'Application link copied')}>Copy link</button>
            <button type="button" className="btn btn-quiet" onClick={() => copy(JSON.stringify(record, null, 2), 'Record JSON copied')}>Copy JSON</button>
          </div>

          <section className="drawer-section">
            <div className="section-heading">
              <h3 className="panel-title">Record facts</h3>
              <AtsPill ats={record.ats} />
            </div>
            <div className="facts">
              <Fact label="Record ID"><span className="accent">{record.id}</span></Fact>
              <Fact label="Company">{record.company_name}</Fact>
              <Fact label="Location">{record.location}{record.remote && ' · remote'}</Fact>
              <Fact label="Stipend">{stipend || <NotStated />}</Fact>
              <Fact label="Duration">{formatDuration(record.duration_months) || <NotStated />}</Fact>
              <Fact label="Deadline">
                {deadline ? <span title={deadline.absolute}>{deadline.absolute} · {deadline.label}</span> : <NotStated />}
              </Fact>
              <Fact label="Experience">{record.experience || <NotStated />}</Fact>
              <Fact label="Discovered"><span title={formatTimestamp(record.discovered_at)}>{relativeTime(record.discovered_at)}</span></Fact>
              <Fact label="Verified"><span title={formatTimestamp(record.last_verified_at)}>{relativeTime(record.last_verified_at)}</span></Fact>
              <Fact label="Status"><StatusDot status={record.status} /></Fact>
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-heading">
              <h3 className="panel-title">Skills in source</h3>
              <span className="eyebrow">{record.skills.length} terms</span>
            </div>
            <div className="skills-list">
              {record.skills.map((skill) => <span className="pill" key={skill}>{skill}</span>)}
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-heading">
              <h3 className="panel-title">Provenance</h3>
              <span className="eyebrow">{record.source_records.length} source records</span>
            </div>
            <ProvenancePanel records={record.source_records} />
          </section>

          <section className="drawer-section">
            <div className="section-heading">
              <h3 className="panel-title">Link health</h3>
              <span className="eyebrow">observed state</span>
            </div>
            <LinkHealth link={record.link_check} status={record.status} />
          </section>

          <section className="drawer-section">
            <div className="section-heading">
              <h3 className="panel-title">Dedup</h3>
              <span className="eyebrow">{record.duplicate_count} merged</span>
            </div>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              Merged from {record.duplicate_count} {record.duplicate_count === 1 ? 'source' : 'sources'} by content similarity.
            </p>
            <div className="hash-line">
              <span>{record.content_hash}</span>
              <button type="button" className="btn btn-sm" onClick={() => copy(record.content_hash, 'Content hash copied')}>Copy hash</button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
