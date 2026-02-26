import { MetricsStrip } from './MetricsStrip';
import { type BuildCounts, type BuildMetrics, type FteResult, type Phase } from '../hooks/useSimulationModel';
import { MOVER_THEME } from '../theme/ascentraTheme';

type BotPanelProps = {
  phase: Phase;
  counts: BuildCounts;
  metrics: BuildMetrics;
  activeAiFte: FteResult;
  status: string;
  explanation: string;
  replayEnabled: boolean;
  analyzing: boolean;
  onReplayBuild: () => void;
};

export function BotPanel({ phase, counts, metrics, activeAiFte, status, explanation, replayEnabled, analyzing, onReplayBuild }: BotPanelProps) {
  const totalPlaced = counts.F + counts.M + counts.S;
  const totalFte = activeAiFte.pickers + activeAiFte.runners;
  const stepState = phase === 'build' ? 'Building' : phase === 'ready' ? 'Ready' : phase === 'paused' ? 'Paused' : phase === 'simulating' ? 'Running' : 'Complete';

  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="panel-title text-lg font-semibold tracking-[0.02em]">Ascentra Engine</h2>
        <div className="phase-track mt-2">
          <div className={`phase-pill ${phase === 'build' ? 'phase-pill-active' : ''}`}>Build</div>
          <div className={`phase-pill ${(phase === 'ready' || phase === 'paused' || phase === 'simulating' || phase === 'finished') ? 'phase-pill-done' : ''}`}>Ready</div>
          <div className={`phase-pill ${(phase === 'simulating' || phase === 'paused' || phase === 'finished') ? 'phase-pill-active' : ''}`}>Simulate</div>
        </div>
        <p className={`status-pill mt-1 ${analyzing ? 'bot-thinking' : ''}`}>
          {stepState} · {status}
        </p>
        <p className="mt-2 text-xs font-medium text-[var(--as-text-sub)]">{explanation}</p>
      </header>

      <section className="subpanel">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">AI Build</h3>
        <ul className="space-y-2 text-sm text-[var(--as-text-main)]">
          <li className="flex items-center justify-between border-b border-borderline/80 pb-2">
            <span className="inline-flex items-center gap-2 text-[var(--as-text-sub)]"><span className={`mover-chip ${MOVER_THEME.F.uiClass}`}>{MOVER_THEME.F.label}</span> movers</span>
            <strong>{counts.F}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/80 pb-2">
            <span className="inline-flex items-center gap-2 text-[var(--as-text-sub)]"><span className={`mover-chip ${MOVER_THEME.M.uiClass}`}>{MOVER_THEME.M.label}</span> movers</span>
            <strong>{counts.M}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/80 pb-2">
            <span className="inline-flex items-center gap-2 text-[var(--as-text-sub)]"><span className={`mover-chip ${MOVER_THEME.S.uiClass}`}>{MOVER_THEME.S.label}</span> movers</span>
            <strong>{counts.S}/6</strong>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-[var(--as-text-sub)]">Placed total</span>
            <strong>{totalPlaced}/18</strong>
          </li>
        </ul>
      </section>

      <section className="subpanel mt-3">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">AI Runtime Profile</h3>
        <div className="grid gap-2 text-sm text-[var(--as-text-main)]">
          <div className="metric-row">
            <span className="metric-label">Pickers</span>
            <strong>{activeAiFte.pickers}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Runners</span>
            <strong>{activeAiFte.runners}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Total FTE</span>
            <strong>{totalFte}</strong>
          </div>
        </div>
      </section>

      <section className="step-action mt-3">
        <h3 className="panel-kicker mb-2 text-[0.7rem] uppercase">AI Action</h3>
        <button
          type="button"
          onClick={onReplayBuild}
          disabled={phase === 'simulating' || !replayEnabled}
          className="control-btn w-full"
        >
          Replay AI Build
        </button>
      </section>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyScore} />
      </div>
    </aside>
  );
}
