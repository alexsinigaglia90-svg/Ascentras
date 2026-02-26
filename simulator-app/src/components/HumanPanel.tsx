import { type Metrics, type TileKind } from '../hooks/useSimulationModel';
import { MetricsStrip } from './MetricsStrip';

type HumanPanelProps = {
  metrics: Metrics;
  counts: Record<TileKind, number>;
  onAddTile: (kind: TileKind) => void;
};

const ACTIONS: Array<{ kind: TileKind; label: string }> = [
  { kind: 'F', label: 'Add Fast' },
  { kind: 'M', label: 'Add Mid' },
  { kind: 'S', label: 'Add Slow' }
];

export function HumanPanel({ metrics, counts, onAddTile }: HumanPanelProps) {
  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Human Builder</h2>
        <p className="mt-1 text-sm text-slate-300">Spawn tiles and drag them directly in the 3D board.</p>
      </header>

      <section className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Pick Circuit Palette</h3>
        <div className="grid gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => onAddTile(action.kind)}
              className="rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30"
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Composition</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Fast Movers (F)</span>
            <strong className="text-slate-50">{counts.F}</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Mid Movers (M)</span>
            <strong className="text-slate-50">{counts.M}</strong>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-300">Slow Movers (S)</span>
            <strong className="text-slate-50">{counts.S}</strong>
          </li>
        </ul>
      </section>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyScore} />
      </div>
    </aside>
  );
}
