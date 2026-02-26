import {
  AUTOMATION_OPTIONS,
  FULFILMENT_OPTIONS,
  STORAGE_OPTIONS,
  type DesignState,
  type DecisionField,
  type Metrics
} from '../hooks/useSimulationModel';
import { MetricsStrip } from './MetricsStrip';

type HumanPanelProps = {
  design: DesignState;
  metrics: Metrics;
  onDecision: (field: DecisionField, value: string) => void;
};

const GROUPS: Array<{ field: DecisionField; title: string; options: string[] }> = [
  { field: 'storageModel', title: 'Storage Model', options: STORAGE_OPTIONS },
  { field: 'fulfilmentLogic', title: 'Fulfilment Logic', options: FULFILMENT_OPTIONS },
  { field: 'automationLevel', title: 'Automation Level', options: AUTOMATION_OPTIONS }
];

export function HumanPanel({ design, metrics, onDecision }: HumanPanelProps) {
  return (
    <aside className="glass-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Your Design</h2>
        <p className="mt-1 text-sm text-slate-300">Choose a strategy and see impact in real time.</p>
      </header>

      <div className="space-y-3">
        {GROUPS.map((group) => (
          <section key={group.field} className="rounded-xl border border-borderline bg-panel/70 p-3 backdrop-blur-md">
            <h3 className="mb-2 text-[0.73rem] uppercase tracking-[0.14em] text-slate-300">{group.title}</h3>
            <div className="grid gap-2">
              {group.options.map((option) => {
                const active = design[group.field] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onDecision(group.field, option)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'border-accent bg-blue-500/30 text-slate-50'
                        : 'border-borderline bg-slate-900/55 text-slate-200 hover:border-blue-300/60'
                    }`}
                    aria-pressed={active}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4">
        <MetricsStrip metrics={metrics} score={metrics.efficiencyIndex} />
      </div>
    </aside>
  );
}
