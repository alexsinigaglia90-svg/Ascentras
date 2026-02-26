import { useEffect, useRef, useState } from 'react';
import type { Metrics } from '../hooks/useSimulationModel';

type MetricsStripProps = {
  metrics: Metrics;
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
  const items = [
    { label: 'Travel Distance', value: metrics.travelDistance },
    { label: 'Congestion Penalty', value: metrics.congestionPenalty },
    { label: 'Zoning Score', value: metrics.zoningScore },
    { label: 'Tiles Placed', value: metrics.totalTiles, digits: 0 }
  ];

  return (
    <section className="rounded-xl border border-borderline bg-panel/90 p-3 shadow-panel backdrop-blur-md">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[0.72rem] uppercase tracking-[0.14em] text-slate-300">Efficiency Index</span>
        <strong className="text-2xl font-semibold text-slate-50 tabular-nums">
          <AnimatedValue value={score} digits={1} />
        </strong>
      </div>
      <ul className="grid gap-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-300">{item.label}</span>
            <span className="tabular-nums text-slate-100"><AnimatedValue value={item.value} digits={item.digits ?? 1} suffix={item.suffix ?? ''} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
