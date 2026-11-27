import { useState } from 'react';

export default function StageFlow({ stages = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = stages[activeIndex] || null;
  const nodeWidth = 136;
  const nodeHeight = 88;
  const step = 168;
  const startX = 18;
  const top = 66;

  return (
    <div className="stage-flow-wrap">
      <svg className="stage-svg" viewBox="0 0 1008 214" role="img" aria-label="Six-stage discovery pipeline with per-stage record counts">
        <title>Discover, crawl, extract, normalize, verify, and publish pipeline</title>
        {stages.slice(0, -1).map((stage, index) => {
          const fromX = startX + index * step + nodeWidth;
          const toX = startX + (index + 1) * step;
          return (
            <g key={`link-${stage.key}`}>
              <line x1={fromX} y1={top + nodeHeight / 2} x2={toX - 8} y2={top + nodeHeight / 2} stroke="var(--line-strong)" strokeWidth="1" />
              <path d={`M${toX - 8} ${top + nodeHeight / 2} l-6 -4 v8 z`} fill="var(--line-strong)" />
              <text x={(fromX + toX) / 2} y={top + nodeHeight / 2 - 9} textAnchor="middle" fill="var(--ink-faint)" fontFamily="var(--font-mono)" fontSize="9">
                −{stages[index + 1].discarded}
              </text>
            </g>
          );
        })}
        {stages.map((stage, index) => {
          const x = startX + index * step;
          return (
            <g
              key={stage.key}
              className="stage-node"
              tabIndex={0}
              role="img"
              aria-label={`${stage.name}: ${stage.count} records. ${stage.description}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <title>{stage.description}</title>
              <rect x={x} y={top} width={nodeWidth} height={nodeHeight} rx="2" fill="var(--surface)" stroke={index === activeIndex ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="1" />
              <text x={x + 12} y={top + 20} fill="var(--ink-faint)" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">
                {String(index + 1).padStart(2, '0')}
              </text>
              <text x={x + 12} y={top + 49} fill="var(--ink)" fontFamily="var(--font-display)" fontSize="26">
                {stage.name}
              </text>
              <text x={x + 12} y={top + 72} fill="var(--accent)" fontFamily="var(--font-mono)" fontSize="14">
                {stage.count}
              </text>
              <text x={x + nodeWidth - 12} y={top + 72} textAnchor="end" fill="var(--ink-faint)" fontFamily="var(--font-mono)" fontSize="9">
                {index === 0 ? 'seed' : `−${stage.discarded}`}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="stage-desc" aria-live="polite">
        <span className="eyebrow">{active?.name} / stage note</span>
        <br />
        {active?.description}
      </p>
      <p className="sr-only">
        Pipeline stages: {stages.map((stage) => `${stage.name} ${stage.count}`).join(', ')}.
      </p>
    </div>
  );
}
