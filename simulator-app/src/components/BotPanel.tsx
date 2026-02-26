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

  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Ascentra Engine</h2>
        <p className={`mt-1 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs tracking-[0.08em] shadow-[0_0_24px_rgba(106,151,224,0.22)] ${analyzing ? 'bot-thinking border-blue-300/45 bg-blue-900/36 text-blue-100' : 'border-blue-300/45 bg-blue-900/36 text-blue-100'}`}>
          {status}
        </p>
        <p className="mt-2 text-xs text-slate-300">{explanation}</p>
      </header>

      <section className="subpanel">
        <h3 className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300">AI Build</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="inline-flex items-center gap-2 text-slate-300"><span className={`mover-chip ${MOVER_THEME.F.uiClass}`}>{MOVER_THEME.F.label}</span> movers</span>
            <strong>{counts.F}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="inline-flex items-center gap-2 text-slate-300"><span className={`mover-chip ${MOVER_THEME.M.uiClass}`}>{MOVER_THEME.M.label}</span> movers</span>
            <strong>{counts.M}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="inline-flex items-center gap-2 text-slate-300"><span className={`mover-chip ${MOVER_THEME.S.uiClass}`}>{MOVER_THEME.S.label}</span> movers</span>
            <strong>{counts.S}/6</strong>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-300">Placed total</span>
            <strong>{totalPlaced}/18</strong>
          </li>
        </ul>
      </section>

      <section className="subpanel mt-3">
        <h3 className="mb-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300">AI Runtime Profile</h3>
        <div className="grid gap-2 text-sm text-slate-200">
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
            <strong>{activeAiFte.total}</strong>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onReplayBuild}
        disabled={phase === 'simulating' || !replayEnabled}
        className="control-btn mt-3 w-full"
      >
        Replay AI build
      </button>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyScore} />
      </div>
    </aside>
  );
}
