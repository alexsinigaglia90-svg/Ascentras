import { MetricsStrip } from './MetricsStrip';
import { type BuildCounts, type BuildMetrics, type FteResult, type Phase } from '../hooks/useSimulationModel';

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
        <p className={`mt-1 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs tracking-[0.08em] ${analyzing ? 'bot-thinking border-blue-300/40 bg-blue-900/35 text-blue-100' : 'border-blue-300/40 bg-blue-900/35 text-blue-100'}`}>
          {status}
        </p>
        <p className="mt-2 text-xs text-slate-300">{explanation}</p>
      </header>

      <section className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">AI Build</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Fast movers</span>
            <strong>{counts.F}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Mid movers</span>
            <strong>{counts.M}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Slow movers</span>
            <strong>{counts.S}/6</strong>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-300">Placed total</span>
            <strong>{totalPlaced}/18</strong>
          </li>
        </ul>
      </section>

      <section className="mt-3 rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">AI Runtime Profile</h3>
        <div className="grid gap-2 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Pickers</span>
            <strong>{activeAiFte.pickers}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Runners</span>
            <strong>{activeAiFte.runners}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Total FTE</span>
            <strong>{activeAiFte.total}</strong>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onReplayBuild}
        disabled={phase === 'simulating' || !replayEnabled}
        className="mt-3 w-full rounded-lg border border-borderline bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:border-blue-300/70 hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Replay AI build
      </button>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyScore} />
      </div>
    </aside>
  );
}
