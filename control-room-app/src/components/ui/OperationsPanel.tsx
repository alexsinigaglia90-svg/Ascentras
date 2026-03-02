import React, { useEffect, useState } from 'react';
import { useStore, type ScenarioMode } from '../../state/store';
import {
  Activity, ArrowDown, ArrowUp, Sun, Moon,
  Eye, EyeOff, ChevronLeft, Play, Pause, SkipBack, SkipForward
} from 'lucide-react';
import styles from './OperationsPanel.module.css';

export function OperationsPanel() {
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const {
    kpis, incidents, shiftMode, scenarioMode, scenarioRuns, replayCursor, performanceMode, cameraTarget,
    setShiftMode, applyScenario, setReplayCursor, clearScenarioRuns, setPerformanceMode, setCameraTarget, acknowledgeAlarm,
  } = useStore();

  const unacked = incidents.filter(i => !i.acknowledged).length;
  const selectedRun = scenarioRuns[Math.max(0, Math.min(replayCursor, scenarioRuns.length - 1))] ?? null;

  const delta = selectedRun && selectedRun.endKpis
    ? {
        throughput: selectedRun.endKpis.throughput - selectedRun.startKpis.throughput,
        backlog: selectedRun.endKpis.backlog - selectedRun.startKpis.backlog,
        utilization: selectedRun.endKpis.utilization - selectedRun.startKpis.utilization,
        downtimeMinutes: selectedRun.endKpis.downtimeMinutes - selectedRun.startKpis.downtimeMinutes,
      }
    : null;

  useEffect(() => {
    if (!isReplayPlaying || scenarioRuns.length <= 1) return;

    const timer = window.setInterval(() => {
      const max = Math.max(0, scenarioRuns.length - 1);
      const next = replayCursor >= max ? 0 : replayCursor + 1;
      setReplayCursor(next);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [isReplayPlaying, replayCursor, scenarioRuns.length, setReplayCursor]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Activity size={14} />
        <span>Operations</span>
        {cameraTarget !== 'overview' && (
          <button className={styles.backBtn} onClick={() => setCameraTarget('overview')}>
            <ChevronLeft size={12} /> Overview
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <KPICard label="Throughput" value={kpis.throughput} unit="u/h" trend="up" />
        <KPICard label="Backlog" value={kpis.backlog} unit="units" trend={kpis.backlog > 100 ? 'up' : 'down'} warning={kpis.backlog > 120} />
        <KPICard label="Missed Cutoffs" value={Math.round(kpis.missedCutoffs)} unit="" warning={kpis.missedCutoffs > 3} />
        <KPICard label="Utilization" value={kpis.utilization} unit="%" />
        <KPICard label="Downtime" value={kpis.downtimeMinutes} unit="min" warning={kpis.downtimeMinutes > 5} />
      </div>

      {/* Incident Feed */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>Incident Feed</span>
          {unacked > 0 && (
            <button className={styles.ackBtn} onClick={acknowledgeAlarm}>
              ACK ({unacked})
            </button>
          )}
        </div>
        <div className={styles.feed}>
          {incidents.slice(0, 12).map(inc => (
            <div
              key={inc.id}
              className={`${styles.incident} ${!inc.acknowledged ? styles.unacked : ''} ${styles[inc.severity]}`}
            >
              <span className={styles.incTime}>{inc.time}</span>
              <span className={styles.incMsg}>{inc.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Director */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>Scenario Director</span>
          <span className={styles.scenarioBadge}>{scenarioMode}</span>
        </div>
        <div className={styles.scenarioGrid}>
          <ScenarioButton current={scenarioMode} mode="baseline" onSelect={applyScenario} label="Baseline" />
          <ScenarioButton current={scenarioMode} mode="peak-hour" onSelect={applyScenario} label="Peak Hour" />
          <ScenarioButton current={scenarioMode} mode="jam-cascade" onSelect={applyScenario} label="Jam Cascade" />
          <ScenarioButton current={scenarioMode} mode="night-shift" onSelect={applyScenario} label="Night Shift" />
        </div>
      </div>

      {/* Scenario Replay */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>Scenario Replay</span>
          <button className={styles.ackBtn} onClick={clearScenarioRuns}>Clear</button>
        </div>
        <div className={styles.replayWrap}>
          <div className={styles.replayControls}>
            <button className={styles.replayBtn} onClick={() => setReplayCursor(Math.max(0, replayCursor - 1))}>
              <SkipBack size={12} />
            </button>
            <button className={`${styles.replayBtn} ${styles.replayPlayBtn}`} onClick={() => setIsReplayPlaying(v => !v)}>
              {isReplayPlaying ? <Pause size={12} /> : <Play size={12} />} {isReplayPlaying ? 'Pause' : 'Play'}
            </button>
            <button className={styles.replayBtn} onClick={() => setReplayCursor(Math.min(Math.max(0, scenarioRuns.length - 1), replayCursor + 1))}>
              <SkipForward size={12} />
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, scenarioRuns.length - 1)}
            value={Math.min(replayCursor, Math.max(0, scenarioRuns.length - 1))}
            onChange={e => {
              setIsReplayPlaying(false);
              setReplayCursor(Number(e.target.value));
            }}
          />
          {selectedRun && (
            <div className={styles.replayMeta}>
              <div className={styles.replayTitle}>
                {selectedRun.mode} · {selectedRun.startTime}{selectedRun.endTime ? ` → ${selectedRun.endTime}` : ' → live'}
              </div>
              {delta && (
                <div className={styles.replayDeltas}>
                  <DeltaChip label="TP" value={delta.throughput} positiveGood />
                  <DeltaChip label="BL" value={delta.backlog} positiveGood={false} />
                  <DeltaChip label="UT" value={delta.utilization} positiveGood />
                  <DeltaChip label="DT" value={delta.downtimeMinutes} positiveGood={false} precision={2} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className={styles.controls}>
        <button
          className={`${styles.shiftBtn} ${shiftMode === 'night' ? styles.shiftNight : ''}`}
          onClick={() => setShiftMode(shiftMode === 'day' ? 'night' : 'day')}
        >
          {shiftMode === 'day' ? <Sun size={14} /> : <Moon size={14} />}
          {shiftMode === 'day' ? 'Day' : 'Night'}
        </button>

        <button
          className={`${styles.perfBtn} ${performanceMode ? styles.perfActive : ''}`}
          onClick={() => setPerformanceMode(!performanceMode)}
          title="Performance mode reduces visual effects"
        >
          {performanceMode ? <EyeOff size={14} /> : <Eye size={14} />}
          Perf
        </button>
      </div>
    </div>
  );
}

function DeltaChip({
  label,
  value,
  positiveGood,
  precision = 0,
}: {
  label: string;
  value: number;
  positiveGood: boolean;
  precision?: number;
}) {
  const positive = value >= 0;
  const good = positiveGood ? positive : !positive;
  const formatted = `${positive ? '+' : ''}${value.toFixed(precision)}`;

  return (
    <span className={`${styles.deltaChip} ${good ? styles.deltaGood : styles.deltaBad}`}>
      {label} {formatted}
    </span>
  );
}

function ScenarioButton({
  current,
  mode,
  onSelect,
  label,
}: {
  current: ScenarioMode;
  mode: ScenarioMode;
  onSelect: (mode: ScenarioMode) => void;
  label: string;
}) {
  return (
    <button
      className={`${styles.scenarioBtn} ${current === mode ? styles.scenarioBtnActive : ''}`}
      onClick={() => onSelect(mode)}
    >
      {label}
    </button>
  );
}

function KPICard({
  label,
  value,
  unit,
  trend,
  warning,
}: {
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down';
  warning?: boolean;
}) {
  return (
    <div className={`${styles.kpi} ${warning ? styles.kpiWarning : ''}`}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>
        {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
        <span className={styles.kpiUnit}>{unit}</span>
        {trend && (
          <span className={styles.kpiTrend}>
            {trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          </span>
        )}
      </div>
    </div>
  );
}
