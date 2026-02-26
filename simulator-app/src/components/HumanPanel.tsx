import { MetricsStrip } from './MetricsStrip';
import { type BuildCounts, type BuildMetrics, type Mission, type Phase, type TileKind } from '../hooks/useSimulationModel';

type HumanPanelProps = {
  mission: Mission;
  phase: Phase;
  canEdit: boolean;
  counts: BuildCounts;
  metrics: BuildMetrics;
  humanReady: boolean;
  simClockLabel: string;
  simSpeed: number;
  onAddTile: (kind: TileKind) => void;
  onRemoveTile: (kind: TileKind) => void;
  onReady: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

const KINDS: Array<{ kind: TileKind; title: string }> = [
  { kind: 'F', title: 'Fast' },
  { kind: 'M', title: 'Mid' },
  { kind: 'S', title: 'Slow' }
];

export function HumanPanel({
  mission,
  phase,
  canEdit,
  counts,
  metrics,
  humanReady,
  simClockLabel,
  simSpeed,
  onAddTile,
  onRemoveTile,
  onReady,
  onStart,
  onPause,
  onReset
}: HumanPanelProps) {
  const total = counts.F + counts.M + counts.S;

  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Human Mission</h2>
        <p className="mt-1 text-sm text-slate-300">Build your pick circuit on the left half and prepare for the 09:00–17:00 run.</p>
      </header>

      <section className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Mission Brief</h3>
        <ul className="space-y-1.5 text-sm text-slate-200">
          <li>Peak season window: {mission.startLabel}–{mission.endLabel}</li>
          <li>Target orders: {mission.targetOrders.toLocaleString()}</li>
          <li>Minimum locations: 18 total (6 Fast / 6 Mid / 6 Slow)</li>
        </ul>
      </section>

      <section className="mt-3 rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Build Controls</h3>
        <div className="grid gap-2">
          {KINDS.map((entry) => (
            <div key={entry.kind} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onAddTile(entry.kind)}
                className="rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Add {entry.title}
              </button>
              <button
                type="button"
                disabled={!canEdit || counts[entry.kind] === 0}
                onClick={() => onRemoveTile(entry.kind)}
                className="rounded-lg border border-borderline bg-slate-900/50 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-blue-300/60 hover:bg-blue-900/22 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Remove {entry.title}
              </button>
              <div className="flex items-center justify-center rounded-lg border border-borderline/70 bg-slate-900/45 px-2 text-sm text-slate-100">
                {counts[entry.kind]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Runtime</h3>
        <div className="grid gap-2 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Simulation clock</span>
            <strong>{simClockLabel}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Speed factor</span>
            <strong>{simSpeed}x</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Placed locations</span>
            <strong>{total}</strong>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!humanReady || phase !== 'build'}
          onClick={onReady}
          className="rounded-lg border border-blue-200/55 bg-blue-700/35 px-3 py-2 text-sm text-slate-50 transition hover:border-blue-100/80 hover:bg-blue-600/45 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Ready
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={phase !== 'ready' && phase !== 'paused'}
          className="rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Start Simulation
        </button>
        <button
          type="button"
          onClick={onPause}
          disabled={phase !== 'simulating'}
          className="rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30"
        >
          Reset
        </button>
      </div>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyScore} />
      </div>
    </aside>
  );
}
