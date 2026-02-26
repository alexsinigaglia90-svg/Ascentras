import type { DesignState, Metrics } from '../hooks/useSimulationModel';
import { MetricsStrip } from './MetricsStrip';

type BotPanelProps = {
  botDesign: DesignState;
  botMetrics: Metrics;
  status: string;
  thinking: boolean;
};

const LABELS: Record<keyof DesignState, string> = {
  storageModel: 'Storage Model',
  fulfilmentLogic: 'Fulfilment Logic',
  automationLevel: 'Automation Level'
};

export function BotPanel({ botDesign, botMetrics, status, thinking }: BotPanelProps) {
  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Ascentra Engine</h2>
        <p className={`mt-1 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs tracking-[0.08em] ${thinking ? 'bot-thinking border-blue-300/40 bg-blue-900/35 text-blue-100' : 'border-borderline bg-slate-900/50 text-slate-200'}`}>
          {status}
        </p>
      </header>

      <section className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
        <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">Engine Configuration</h3>
        <ul className="space-y-2">
          {(Object.keys(botDesign) as Array<keyof DesignState>).map((field) => (
            <li key={field} className="flex justify-between gap-2 border-b border-borderline/60 pb-2 text-sm last:border-b-0 last:pb-0">
              <span className="text-slate-300">{LABELS[field]}</span>
              <span className="text-right text-slate-50">{botDesign[field]}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4">
        <MetricsStrip metrics={botMetrics} score={botMetrics.efficiencyIndex} />
      </div>
    </aside>
  );
}
