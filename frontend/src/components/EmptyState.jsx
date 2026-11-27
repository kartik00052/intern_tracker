export default function EmptyState({ title = 'No records found', message = 'Try clearing a filter or widening your search.', action }) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="8" y="5" width="32" height="38" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M14 15h20M14 22h20M14 29h12" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="1.2" />
        <path d="M37 37l5 5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
