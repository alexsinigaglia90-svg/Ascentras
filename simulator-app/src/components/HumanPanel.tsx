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

const KIND_BTN_CLASS: Record<TileKind, string> = {
  F: 'control-btn-kind-fast',
  M: 'control-btn-kind-mid',
  S: 'control-btn-kind-slow'
};

const KIND_COUNT_CLASS: Record<TileKind, string> = {
  F: 'mover-count-pill-fast',
  M: 'mover-count-pill-mid',
  S: 'mover-count-pill-slow'
};

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
  const currentStep = phase === 'build' ? 'build' : phase === 'ready' ? 'ready' : 'simulate';

  const primaryAction =
    phase === 'build'
      ? {
          label: 'Ready',
          onClick: onReady,
          disabled: !humanReady
        }
      : phase === 'ready'
        ? {
            label: 'Start Simulation',
            onClick: onStart,
            disabled: !canStartSimulation
          }
        : phase === 'simulating'
          ? {
              label: 'Pause',
              onClick: onPause,
              disabled: false
            }
          : phase === 'paused'
            ? {
                label: 'Resume',
                onClick: onStart,
                disabled: !canStartSimulation
              }
            : {
                label: 'Reset',
                onClick: onReset,
                disabled: false
              };

  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="panel-title text-lg font-semibold tracking-[0.02em]">Human Mission</h2>
        <div className="phase-track mt-2">
          <div className={`phase-pill ${currentStep === 'build' ? 'phase-pill-active' : ''}`}>Build</div>
          <div className={`phase-pill ${currentStep === 'ready' ? 'phase-pill-active' : ''} ${phase !== 'build' ? 'phase-pill-done' : ''}`}>Ready</div>
          <div className={`phase-pill ${currentStep === 'simulate' ? 'phase-pill-active' : ''} ${(phase === 'simulating' || phase === 'paused' || phase === 'finished') ? 'phase-pill-done' : ''}`}>Simulate</div>
        </div>
      </header>

      <section className="subpanel">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">Mission Brief</h3>
        <ul className="space-y-1.5 text-sm text-[var(--as-text-main)]">
          <li>Peak season window: {mission.startLabel}–{mission.endLabel}</li>
          <li>Target orders: {mission.targetOrders.toLocaleString()}</li>
          <li>Minimum locations: 18 total (6 Fast / 6 Mid / 6 Slow)</li>
        </ul>
      </section>

      <section className="subpanel mt-3">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">Mover Palette</h3>
        <div className="grid gap-2">
          {KINDS.map((kind) => (
            <div key={kind} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onAddTile(kind)}
                className={`control-btn ${KIND_BTN_CLASS[kind]} text-left`}
              >
                <span className={`mover-chip ${MOVER_THEME[kind].uiClass}`}>{MOVER_THEME[kind].label}</span>
                <span className="ml-2">Add</span>
              </button>
              <button
                type="button"
                disabled={!canEdit || counts[kind] === 0}
                onClick={() => onRemoveTile(kind)}
                className={`control-btn ${KIND_BTN_CLASS[kind]} text-left`}
              >
                <span className={`mover-chip ${MOVER_THEME[kind].uiClass}`}>{MOVER_THEME[kind].label}</span>
                <span className="ml-2">Remove</span>
              </button>
              <div className={`mover-count-pill ${KIND_COUNT_CLASS[kind]}`}>
                <span className="text-base leading-none">{counts[kind]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="subpanel mt-3">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">Runtime</h3>
        <div className="grid gap-2 text-sm text-[var(--as-text-main)]">
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

      <section className="step-action mt-3">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">Current Action</h3>
        <button
          type="button"
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
          className="control-btn control-btn-active w-full"
        >
          {primaryAction.label}
        </button>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
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
          onClick={onStart}
          disabled={!(phase === 'paused' && canStartSimulation)}
          className="control-btn"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={onReset}
          className="control-btn col-span-2"
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
