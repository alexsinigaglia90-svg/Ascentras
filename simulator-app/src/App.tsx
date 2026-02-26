import { lazy, Suspense } from 'react';
import { BotPanel } from './components/BotPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HumanPanel } from './components/HumanPanel';
import { useSimulationModel } from './hooks/useSimulationModel';

const LazyThreeScene = lazy(async () => {
  const module = await import('./components/ThreeScene');
  return { default: module.ThreeScene };
});

export default function WarehouseSimulatorPage() {
  const {
    humanDesign,
    botDesign,
    humanMetrics,
    botMetrics,
    botStatus,
    botThinking,
    botPulseKey,
    setDecision,
    reset
  } = useSimulationModel();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ink text-slate-100">
      <ErrorBoundary
        fallbackRender={(error) => {
          console.error('[Simulator] 3D background crashed; rendering fallback background.', error);
          return (
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_16%_18%,rgba(104,142,202,0.16),transparent_44%),radial-gradient(circle_at_86%_82%,rgba(108,140,197,0.12),transparent_46%),linear-gradient(180deg,#060b12,#080d15)]" />
          );
        }}
      >
        <Suspense fallback={null}>
          <LazyThreeScene
            metrics={humanMetrics}
            automationLevel={humanDesign.automationLevel}
            botPulseKey={botPulseKey}
          />
        </Suspense>
      </ErrorBoundary>

      <main className="relative z-10 grid h-screen grid-rows-[auto_1fr] gap-3 p-3">
        <header className="rounded-2xl border border-borderline bg-panel px-4 py-3 shadow-panel backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-50">Warehouse Strategy Simulator</h1>
              <p className="mt-1 text-sm text-slate-300">Human vs Ascentra Engine</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-blue-200/50 bg-blue-700/35 px-4 py-2 text-sm text-slate-50 transition hover:-translate-y-[1px] hover:border-blue-100/80 hover:bg-blue-600/45"
            >
              Reset
            </button>
          </div>
        </header>

        <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(340px,420px)_1fr_minmax(340px,420px)] xl:items-stretch">
          <HumanPanel design={humanDesign} metrics={humanMetrics} onDecision={setDecision} />

          <div className="hidden rounded-2xl border border-borderline/60 bg-slate-900/20 backdrop-blur-[2px] xl:block" />

          <BotPanel
            botDesign={botDesign}
            botMetrics={botMetrics}
            status={botStatus}
            thinking={botThinking}
          />
        </section>
      </main>
    </div>
  );
}
