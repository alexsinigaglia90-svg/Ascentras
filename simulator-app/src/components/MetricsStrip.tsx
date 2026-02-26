import { useEffect, useRef, useState } from 'react';
import type { BuildMetrics } from '../hooks/useSimulationModel';

type MetricsStripProps = {
  metrics: BuildMetrics;
  score: number;
};

function AnimatedValue({ value, digits = 1, suffix = '' }: { value: number; digits?: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const start = previous.current;
    const delta = value - start;
    const duration = 360;
    const startTime = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + delta * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        previous.current = value;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toFixed(digits)}{suffix}</>;
}

export function MetricsStrip({ metrics, score }: MetricsStripProps) {
  const items: Array<{ label: string; value: number; digits?: number; suffix?: string }> = [
    { label: 'Travel Distance', value: metrics.travelDistance },
    { label: 'Congestion Penalty', value: metrics.congestionPenalty },
    { label: 'Zoning Score', value: metrics.zoningScore },
    { label: 'Tiles Placed', value: metrics.totalTiles, digits: 0 }
  ];

  return (
    <section className="subpanel">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[#4d5d72]">Efficiency Index</span>
        <strong className="text-2xl font-semibold text-[#1f4e77] tabular-nums">
          <AnimatedValue value={score} digits={1} />
        </strong>
      </div>
      <ul className="grid gap-1.5">
        {items.map((item) => (
          <li key={item.label} className="metric-row">
            <span className="metric-label">{item.label}</span>
            <span className="tabular-nums text-[#0d1b2c]"><AnimatedValue value={item.value} digits={item.digits ?? 1} suffix={item.suffix ?? ''} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
