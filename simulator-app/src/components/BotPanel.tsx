import { type Metrics, type TileKind } from '../hooks/useSimulationModel';
import { MetricsStrip } from './MetricsStrip';

type BotPanelProps = {
  botMetrics: Metrics;
  status: string;
  thinking: boolean;
  counts: Record<TileKind, number>;
};

export function BotPanel({ botMetrics, status, thinking, counts }: BotPanelProps) {
  const totalPlaced = counts.F + counts.M + counts.S;

  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Ascentra AI Builder</h2>
        <p className={`mt-1 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs tracking-[0.08em] ${thinking ? 'bot-thinking border-blue-300/40 bg-blue-900/35 text-blue-100' : 'border-borderline bg-slate-900/50 text-slate-200'}`}>
          {status}
        </p>
      </header>

      <section className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Heuristic Targets</h3>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Fast near Depot</span>
            <strong>{counts.F}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Mid balanced ring</span>
            <strong>{counts.M}/6</strong>
          </li>
          <li className="flex items-center justify-between border-b border-borderline/60 pb-2">
            <span className="text-slate-300">Slow far ring</span>
            <strong>{counts.S}/6</strong>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-300">Total planned</span>
            <strong>{totalPlaced}/18</strong>
          </li>
        </ul>
      </section>

      <div className="mt-4">
        <MetricsStrip metrics={botMetrics} score={botMetrics.efficiencyScore} />
      </div>
    </aside>
  );
}
