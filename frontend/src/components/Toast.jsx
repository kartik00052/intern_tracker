export default function Toast({ items = [], onDismiss }) {
  return (
    <section className="toast-stack" aria-live="polite" aria-label="Notifications">
      {items.map((item) => (
        <div className="toast" key={item.id}>
          <span>{item.message}</span>
          <button type="button" className="icon-btn" aria-label="Dismiss notification" onClick={() => onDismiss(item.id)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
          </button>
        </div>
      ))}
    </section>
  );
}
