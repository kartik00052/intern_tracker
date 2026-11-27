export default function BarStrip({ data = [], onSelect }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.discovered, item.published]));
  const summary = `${data.length} days of discovery activity. Peak ${Math.max(...data.map((item) => item.discovered))} postings discovered.`;

  return (
    <figure>
      <div className="bar-strip">
        {data.map((item, index) => (
          <button
            type="button"
            className="bar-pair"
            key={item.date}
            aria-label={`${item.label}: ${item.discovered} discovered, ${item.published} published`}
            onClick={() => onSelect?.(item)}
          >
            <span
              className="bar-fill"
              style={{ height: `${Math.max(3, (item.discovered / max) * 100)}%`, animationDelay: `${Math.min(index * 14, 280)}ms` }}
              aria-hidden="true"
            />
            <span
              className="bar-fill is-published"
              style={{ height: `${Math.max(3, (item.published / max) * 100)}%`, animationDelay: `${Math.min(index * 14 + 40, 320)}ms` }}
              aria-hidden="true"
            />
            <span className="chart-tooltip" aria-hidden="true">
              {item.label}
              <br />
              {item.discovered} discovered / {item.published} published
            </span>
          </button>
        ))}
      </div>
      <div className="chart-axis" aria-hidden="true">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <figcaption className="chart-summary">{summary} Each mark is focusable and reports its own values.</figcaption>
    </figure>
  );
}
