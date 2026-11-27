export default function Sparkline({ values = [], label = 'Activity trend' }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * 92 + 2 : 2;
    const y = 22 - (value / max) * 19;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1] || '2,22';

  return (
    <svg className="sparkline" viewBox="0 0 96 24" role="img" aria-label={`${label}: ${values.join(', ')}`}>
      <path d="M2 22 H94" stroke="var(--line)" strokeWidth="1" />
      {points.length > 1 && <polyline points={points.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="1.4" />}
      <circle cx={last.split(',')[0]} cy={last.split(',')[1]} r="2" fill="var(--accent)" />
    </svg>
  );
}
