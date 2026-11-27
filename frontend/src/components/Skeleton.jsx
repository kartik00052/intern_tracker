export default function Skeleton({ rows = 6, variant = 'table' }) {
  return (
    <div role="status" aria-label="Loading records">
      <span className="sr-only">Loading records</span>
      <div className={variant === 'table' ? 'table-wrap' : ''} aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton-row" key={index} style={{ animationDelay: `${index * 45}ms` }}>
            <span className="skeleton skeleton-bar" />
            <span className="skeleton skeleton-bar" />
            <span className="skeleton skeleton-bar" />
            <span className="skeleton skeleton-bar" />
          </div>
        ))}
      </div>
    </div>
  );
}
