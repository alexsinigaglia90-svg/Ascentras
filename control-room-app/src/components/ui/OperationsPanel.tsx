import React from 'react';
import { useStore, type ScenarioMode } from '../../state/store';
import {
  Activity, ArrowDown, ArrowUp, Sun, Moon,
  Eye, EyeOff, ChevronLeft
} from 'lucide-react';
import styles from './OperationsPanel.module.css';

export function OperationsPanel() {
  const {
    kpis, incidents, shiftMode, scenarioMode, performanceMode, cameraTarget,
    setShiftMode, applyScenario, setPerformanceMode, setCameraTarget, acknowledgeAlarm,
  } = useStore();

  const unacked = incidents.filter(i => !i.acknowledged).length;

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
