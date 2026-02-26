import { MetricsStrip } from './MetricsStrip';
import { type BuildCounts, type BuildMetrics, type Mission, type Phase, type TileKind } from '../hooks/useSimulationModel';
import { MOVER_THEME } from '../theme/ascentraTheme';

type HumanPanelProps = {
  mission: Mission;
  phase: Phase;
  canEdit: boolean;
  counts: BuildCounts;
  metrics: BuildMetrics;
  humanReady: boolean;
  canStartSimulation: boolean;
  simClockLabel: string;
  simSpeed: number;
  onAddTile: (kind: TileKind) => void;
  onRemoveTile: (kind: TileKind) => void;
  onReady: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

const KINDS: TileKind[] = ['F', 'M', 'S'];

export function HumanPanel({
  mission,
  phase,
  canEdit,
  counts,
  metrics,
  humanReady,
  canStartSimulation,
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
        <h2 className="text-lg font-semibold tracking-[0.01em] text-slate-50">Human Mission</h2>
        <p className="mt-1 text-sm text-slate-300/95">Build your pick circuit on the left half and prepare for the 09:00–17:00 run.</p>
      </header>

      <section className="subpanel">
        <h3 className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300">Mission Brief</h3>
        <ul className="space-y-1.5 text-sm text-slate-200">
          <li>Peak season window: {mission.startLabel}–{mission.endLabel}</li>
          <li>Target orders: {mission.targetOrders.toLocaleString()}</li>
          <li>Minimum locations: 18 total (6 Fast / 6 Mid / 6 Slow)</li>
        </ul>
      </section>

      <section className="subpanel mt-3">
        <h3 className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300">Build Controls</h3>
        <div className="grid gap-2">
          {KINDS.map((kind) => (
            <div key={kind} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onAddTile(kind)}
                className="control-btn text-left"
              >
                <span className={`mover-chip ${MOVER_THEME[kind].uiClass}`}>{MOVER_THEME[kind].label}</span>
                <span className="ml-2">Add</span>
              </button>
              <button
                type="button"
                disabled={!canEdit || counts[kind] === 0}
                onClick={() => onRemoveTile(kind)}
                className="control-btn text-left"
              >
                <span className={`mover-chip ${MOVER_THEME[kind].uiClass}`}>{MOVER_THEME[kind].label}</span>
                <span className="ml-2">Remove</span>
              </button>
              <div className="flex items-center justify-center rounded-lg border border-borderline/70 bg-slate-900/45 px-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(223,236,255,0.08)]">
                <span className={`mover-chip ${MOVER_THEME[kind].uiClass}`}>{counts[kind]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="subpanel mt-3">
        <h3 className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300">Runtime</h3>
        <div className="grid gap-2 text-sm text-slate-200">
          <div className="metric-row">
            <span className="metric-label">Simulation clock</span>
            <strong>{simClockLabel}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Speed factor</span>
            <strong>{simSpeed}x</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Placed locations</span>
            <strong>{total}</strong>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!humanReady || phase !== 'build'}
          onClick={onReady}
          className="control-btn control-btn-active"
        >
          Ready
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStartSimulation}
          className="control-btn"
        >
          Start Simulation
        </button>
        <button
          type="button"
          onClick={onPause}
          disabled={phase !== 'simulating'}
          className="control-btn"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={onReset}
          className="control-btn"
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
