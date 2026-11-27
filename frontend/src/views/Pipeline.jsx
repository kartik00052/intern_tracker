import { Fragment, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StageFlow from '../components/StageFlow.jsx';
import StatusDot from '../components/StatusDot.jsx';
import * as api from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { formatClock, formatNumber, formatTimestamp, relativeTime } from '../lib/format.js';

export default function Pipeline() {
  const [expandedRun, setExpandedRun] = useState(null);
  const pipelineState = useAsync(() => api.getPipeline(), []);
  const runsState = useAsync(() => api.listCrawlRuns(), []);

  if (pipelineState.loading || runsState.loading) {
    return (
      <>
        <div className="page-head">
          <div>
            <span className="eyebrow">Operations / pipeline</span>
            <h1 className="page-title">Pipeline</h1>
          </div>
        </div>
        <Skeleton rows={9} />
      </>
    );
  }

  if (pipelineState.error || runsState.error || !pipelineState.data || !runsState.data) {
    return (
      <EmptyState
        title="Pipeline unavailable"
        message="The pipeline snapshot or crawl-run log could not be read."
        action={<button type="button" className="btn" onClick={() => { pipelineState.reload(); runsState.reload(); }}>Retry</button>}
      />
    );
  }

  const pipeline = pipelineState.data;
  const runs = runsState.data;
  const maxDuration = Math.max(...runs.map((run) => run.duration_s));

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Operations / pipeline</span>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-lede">{formatNumber(pipeline.discovered)} discovered → {pipeline.discarded} discarded as non-internships → {pipeline.published} published.</p>
        </div>
        <div className="live-status" title={pipeline.lastCrawlAt}>
          <span className="pulse-dot" aria-hidden="true" />
          <span>last run {relativeTime(pipeline.lastCrawlAt)}</span>
        </div>
      </div>

      <section className="pipeline-summary" aria-label="Pipeline summary">
        <div className="pipeline-summary-cell">
          <span className="metric-label">Discovered</span>
          <strong>{pipeline.discovered}</strong>
          <span className="metric-note">raw public postings</span>
        </div>
        <div className="pipeline-summary-cell">
          <span className="metric-label">Discarded in normalize</span>
          <strong>{pipeline.discarded}</strong>
          <span className="metric-note">non-internships</span>
        </div>
        <div className="pipeline-summary-cell">
          <span className="metric-label">Published</span>
          <strong>{pipeline.published}</strong>
          <span className="metric-note">verified records</span>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }} aria-labelledby="stage-heading">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Fig. 04 / flow</span>
            <h2 className="panel-title" id="stage-heading">Six-stage discovery flow</h2>
          </div>
          <span className="eyebrow">hover or focus a stage</span>
        </div>
        <div className="panel-body">
          <StageFlow stages={pipeline.stages} />
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }} aria-labelledby="runs-heading">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Log / crawl_runs</span>
            <h2 className="panel-title" id="runs-heading">Recent crawl runs</h2>
          </div>
          <span className="eyebrow">{runs.length} runs</span>
        </div>
        <div className="table-wrap">
          <table className="crawl-table">
            <caption className="sr-only">Recent crawl runs with status, duration, discoveries and errors</caption>
            <thead>
              <tr>
                <th scope="col">Run ID</th>
                <th scope="col">Adapter</th>
                <th scope="col">Target</th>
                <th scope="col">Started</th>
                <th scope="col">Status</th>
                <th scope="col">Duration</th>
                <th scope="col">Found</th>
                <th scope="col">New</th>
                <th scope="col">Errors</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <Fragment key={run.id}>
                  <tr className={expandedRun === run.id ? 'error-open' : ''}>
                    <td>{run.id}</td>
                    <td>{run.adapter}</td>
                    <td>{run.target}</td>
                    <td title={formatTimestamp(run.started_at)}>{relativeTime(run.started_at)}</td>
                    <td><StatusDot status={run.status} /></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="duration-track"><span className="duration-fill" style={{ width: `${(run.duration_s / maxDuration) * 100}%` }} /></span>
                        {formatClock(run.duration_s)}
                      </span>
                    </td>
                    <td>{run.discovered}</td>
                    <td>{run.new}</td>
                    <td>
                      {run.errors ? (
                        <button
                          type="button"
                          className="error-toggle"
                          aria-expanded={expandedRun === run.id}
                          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                        >
                          {run.errors} · {expandedRun === run.id ? 'hide' : 'show'}
                        </button>
                      ) : <span className="faint">0</span>}
                    </td>
                  </tr>
                  {expandedRun === run.id && (
                    <tr className="error-detail-row">
                      <td colSpan="9">Observed error: {run.error_detail || 'No sample message captured.'}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
