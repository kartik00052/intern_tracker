export default function StatusDot({ status, label = true }) {
  return (
    <span className="status-cell">
      <span className="status-dot" data-status={status} aria-hidden="true" />
      {label ? <span>{status}</span> : <span className="sr-only">{status}</span>}
    </span>
  );
}
