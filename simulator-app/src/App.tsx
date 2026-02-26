import { lazy, Suspense, useState, type KeyboardEvent } from 'react';
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

  const humanTotalFte = results ? results.human.requiredFte.pickers + results.human.requiredFte.runners : 0;
  const aiTotalFte = results ? results.ai.requiredFte.pickers + results.ai.requiredFte.runners : 0;
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const hasProgressToLose =
    humanTiles.length > 0 ||
    aiTiles.length > 0 ||
    phase !== 'build' ||
    readyPressedOnce ||
    Boolean(results);

  const onBackToSiteKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  const requestReset = () => {
    if (!hasProgressToLose) {
      reset();
      return;
    }

    setResetConfirmOpen(true);
  };

  const confirmReset = () => {
    setResetConfirmOpen(false);
    reset();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ink text-[var(--as-text-main)]">
      <main className="relative z-10 grid h-screen grid-rows-[auto_auto_1fr] gap-3 p-3">
        <header className="glass-panel px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="control-btn"
                onKeyDown={onBackToSiteKeyDown}
                aria-label="Back to main site"
              >
                ← Back to site
              </a>
              <div>
                <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-[var(--as-text-sub)]">
                  <a href="/" className="text-[var(--as-accent)] hover:underline focus-visible:underline">Home</a>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page" className="text-[var(--as-text-main)]">Simulator</span>
                </nav>
                <h1 className="text-xl font-semibold tracking-[0.015em] text-[var(--as-text-main)]">Build → Ready → Simulate</h1>
                <p className="mt-1 text-sm font-medium text-[var(--as-text-sub)]">Pick Circuit Builder · Human vs Ascentra Engine</p>
              </div>
            </div>
            <div className="rounded-full border border-borderline/90 bg-panel/80 px-4 py-2 text-sm font-semibold text-[var(--as-accent-strong)] shadow-panel">
              Clock {simClockLabel}
            </div>
          </div>
        </header>

        {results ? (
          <section className="glass-panel px-4 py-2" aria-label="Simulation results summary">
            <div className="grid grid-cols-1 gap-2 text-sm text-[var(--as-text-main)] xl:grid-cols-[1fr_auto_1fr] xl:items-center">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--as-text-sub)]">Human</span>
                <span>Orders {results.human.kpis.completedOrders.toLocaleString()} / {results.missionTarget.toLocaleString()}</span>
                <span>Cycle {results.human.kpis.avgCycleTimeSeconds.toFixed(1)}s</span>
                <span>FTE {humanTotalFte}</span>
              </div>

              <div className="hidden xl:block h-8 w-px bg-borderline/80" aria-hidden="true" />

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 xl:justify-end">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--as-text-sub)]">Ascentra</span>
                <span>Orders {results.ai.kpis.completedOrders.toLocaleString()} / {results.missionTarget.toLocaleString()}</span>
                <span>Cycle {results.ai.kpis.avgCycleTimeSeconds.toFixed(1)}s</span>
                <span>FTE {aiTotalFte}</span>
              </div>
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--as-accent-strong)]">{results.conclusion}</p>
          </section>
        ) : null}

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
            onReset={requestReset}
          />

          <div className="relative min-h-[420px] rounded-2xl border border-borderline/80 bg-panel/40 shadow-panel backdrop-blur-[1px]">
            <ErrorBoundary
              fallbackRender={(error) => {
                console.error('[Simulator] 3D board crashed; rendering center fallback.', error);
                return (
                  <div className="absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(circle_at_16%_18%,rgba(117,160,224,0.16),transparent_44%),radial-gradient(circle_at_86%_82%,rgba(117,160,224,0.1),transparent_46%),linear-gradient(180deg,#060d18,#091424)]" />
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

      {resetConfirmOpen ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-[#030711]/62 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-layout-title" aria-describedby="reset-layout-copy">
          <div className="glass-panel w-full max-w-md p-5">
            <h2 id="reset-layout-title" className="panel-title text-lg font-semibold">Reset layout?</h2>
            <p id="reset-layout-copy" className="mt-2 text-sm text-[var(--as-text-sub)]">
              This will clear your current simulator setup and progress.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="control-btn"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="control-btn control-btn-active"
                onClick={confirmReset}
              >
                Reset layout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
