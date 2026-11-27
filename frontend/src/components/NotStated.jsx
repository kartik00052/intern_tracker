export default function NotStated({ compact = false }) {
  return (
    <span
      className={`not-stated${compact ? ' is-compact' : ''}`}
      tabIndex={0}
      role="note"
      aria-label="Not stated. Absent in source, never inferred."
      data-tooltip="Absent in source, never inferred"
    >
      Not stated
    </span>
  );
}
