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
    mission,
    phase,
    canEdit,
    humanReady,
    canStartSimulation,
    simSpeed,
    simClockLabel,

    humanTiles,
    aiTiles,
    humanCounts,
    aiCounts,
    humanMetrics,
    botMetrics,
    spawnDragTileId,
    aiActiveTileId,
    aiStatus,
    aiExplanation,
    aiAnalyzing,
    readyPressedOnce,
    humanStations,
    aiStations,
    visualState,
    results,
    activeAiFte,

    spawnHumanTile,
    removeHumanTile,
    removeHumanTileById,
    consumeSpawnDragTile,
    commitHumanTile,
    markReady,
    startSimulation,
    pauseSimulation,
    setAiBuildReplayPulse,
    reset
  } = useSimulationModel();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ink text-slate-100">
      <main className="relative z-10 grid h-screen grid-rows-[auto_1fr] gap-3 p-3">
        <header className="glass-panel px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-50">Build → Ready → Simulate</h1>
              <p className="mt-1 text-sm text-slate-300/95">Pick Circuit Builder · Human vs Ascentra Engine</p>
            </div>
            <div className="rounded-full border border-borderline/80 bg-slate-900/48 px-4 py-2 text-sm text-slate-200 shadow-[0_0_20px_rgba(120,156,218,0.18)]">
              Clock {simClockLabel}
            </div>
          </div>
        </header>

        <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(340px,420px)_1fr_minmax(340px,420px)] xl:items-stretch">
          <HumanPanel
            mission={mission}
            phase={phase}
            canEdit={canEdit}
            counts={humanCounts}
            metrics={humanMetrics}
            humanReady={humanReady}
            canStartSimulation={canStartSimulation}
            simClockLabel={simClockLabel}
            simSpeed={simSpeed}
            onAddTile={spawnHumanTile}
            onRemoveTile={removeHumanTile}
            onReady={markReady}
            onStart={startSimulation}
            onPause={pauseSimulation}
            onReset={reset}
          />

          <div className="relative min-h-[420px] rounded-2xl border border-borderline/60 bg-slate-900/24 shadow-[0_0_28px_rgba(108,150,218,0.12)] backdrop-blur-[2px]">
            <ErrorBoundary
              fallbackRender={(error) => {
                console.error('[Simulator] 3D board crashed; rendering center fallback.', error);
                return (
                  <div className="absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(circle_at_16%_18%,rgba(104,142,202,0.16),transparent_44%),radial-gradient(circle_at_86%_82%,rgba(108,140,197,0.12),transparent_46%),linear-gradient(180deg,#060b12,#080d15)]" />
                );
              }}
            >
              <Suspense fallback={null}>
                <LazyThreeScene
                  phase={phase}
                  canEdit={canEdit}
                  humanTiles={humanTiles}
                  aiTiles={aiTiles}
                  humanStations={humanStations}
                  aiStations={aiStations}
                  spawnDragTileId={spawnDragTileId}
                  aiActiveTileId={aiActiveTileId}
                  visualState={visualState}
                  onCommitHumanTile={commitHumanTile}
                  onRemoveHumanTileById={removeHumanTileById}
                  onConsumeSpawnDragTile={consumeSpawnDragTile}
                />
              </Suspense>
            </ErrorBoundary>

            {results ? (
              <div className="pointer-events-none absolute inset-x-6 bottom-6 z-20 rounded-xl border border-blue-200/45 bg-panel/90 p-4 shadow-panel shadow-[0_0_30px_rgba(114,160,230,0.24)] backdrop-blur-md">
                <div className="grid gap-2 text-sm text-slate-100 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Human Result</p>
                    <p>Orders: {results.human.kpis.completedOrders.toLocaleString()} / {results.missionTarget.toLocaleString()}</p>
                    <p>Avg cycle: {results.human.kpis.avgCycleTimeSeconds.toFixed(1)}s</p>
                    <p>FTE: {results.human.requiredFte.pickers} pickers + {results.human.requiredFte.runners} runners = {results.human.requiredFte.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Ascentra Result</p>
                    <p>Orders: {results.ai.kpis.completedOrders.toLocaleString()} / {results.missionTarget.toLocaleString()}</p>
                    <p>Avg cycle: {results.ai.kpis.avgCycleTimeSeconds.toFixed(1)}s</p>
                    <p>FTE: {results.ai.requiredFte.pickers} pickers + {results.ai.requiredFte.runners} runners = {results.ai.requiredFte.total}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-blue-100">{results.conclusion}</p>
              </div>
            ) : null}
          </div>

          <BotPanel
            phase={phase}
            counts={aiCounts}
            metrics={botMetrics}
            activeAiFte={activeAiFte}
            status={aiStatus}
            explanation={aiExplanation}
            replayEnabled={readyPressedOnce && !aiAnalyzing}
            analyzing={aiAnalyzing}
            onReplayBuild={setAiBuildReplayPulse}
          />
        </section>
      </main>
    </div>
  );
}
