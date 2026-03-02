import React from 'react';
import { useStore } from '../../state/store';
import {
  Play, Square, Gauge, AlertTriangle, Zap,
  ToggleLeft, ToggleRight, RotateCcw
} from 'lucide-react';
import styles from './SystemsPanel.module.css';

export function SystemsPanel() {
  const {
    depalletizerRunning, depalletizerSpeed, depalletizerFault,
    toggleDepalletizer, setDepalletizerSpeed, toggleDepalletizerFault,
    autostoreSpeed, autostoreHeatmap, autostoreBinDensity,
    setAutostoreSpeed, toggleAutostoreHeatmap, setAutostoreBinDensity,
    palletizerRunning, palletizerPattern, palletizerOutputRate,
    togglePalletizer, setPalletizerPattern, setPalletizerOutputRate,
    conveyorRunning, conveyorDivert, conveyorJam, conveyorJamClearing,
    toggleConveyor, toggleConveyorDivert, triggerJamClear,
    emergencyStop,
    triggerEmergencyStop, resetEmergencyStop, acknowledgeAlarm,
    setCameraTarget,
  } = useStore();

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Gauge size={14} />
        <span>Systems</span>
      </div>

      {/* Depalletizer */}
      <Section
        title="Depalletizer"
        onClick={() => setCameraTarget('depalletizer')}
        status={depalletizerFault ? 'fault' : depalletizerRunning ? 'running' : 'stopped'}
      >
        <div className={styles.row}>
          <ControlButton
            active={depalletizerRunning}
            onClick={toggleDepalletizer}
            disabled={emergencyStop}
          >
            {depalletizerRunning ? <Square size={12} /> : <Play size={12} />}
            {depalletizerRunning ? 'Stop' : 'Start'}
          </ControlButton>
          <ControlButton
            active={depalletizerFault}
            onClick={toggleDepalletizerFault}
            variant="warning"
          >
            <AlertTriangle size={12} />
            Fault
          </ControlButton>
        </div>
        <SliderControl
          label="Speed"
          value={depalletizerSpeed}
          onChange={setDepalletizerSpeed}
          min={20}
          max={120}
          unit="%"
        />
      </Section>

      {/* AutoStore */}
      <Section
        title="AutoStore"
        onClick={() => setCameraTarget('autostore')}
        status={emergencyStop ? 'stopped' : autostoreSpeed > 160 ? 'warning' : 'running'}
      >
        <SliderControl
          label="Speed"
          value={autostoreSpeed}
          onChange={setAutostoreSpeed}
          min={0}
          max={200}
          unit="%"
        />
        <div className={styles.row}>
          <ToggleButton active={autostoreHeatmap} onClick={toggleAutostoreHeatmap}>
            Heatmap
          </ToggleButton>
        </div>
        <SliderControl
          label="Bin Density"
          value={autostoreBinDensity}
          onChange={setAutostoreBinDensity}
          min={10}
          max={100}
          unit="%"
        />
      </Section>

      {/* Palletizer */}
      <Section
        title="Palletizer"
        onClick={() => setCameraTarget('palletizer')}
        status={palletizerRunning ? 'running' : 'stopped'}
      >
        <div className={styles.row}>
          <ControlButton
            active={palletizerRunning}
            onClick={togglePalletizer}
            disabled={emergencyStop}
          >
            {palletizerRunning ? <Square size={12} /> : <Play size={12} />}
            {palletizerRunning ? 'Stop' : 'Start'}
          </ControlButton>
          <ControlButton
            active={palletizerPattern === 'B'}
            onClick={() => setPalletizerPattern(palletizerPattern === 'A' ? 'B' : 'A')}
          >
            Pattern {palletizerPattern}
          </ControlButton>
        </div>
        <SliderControl
          label="Output"
          value={palletizerOutputRate}
          onChange={setPalletizerOutputRate}
          min={20}
          max={120}
          unit="%"
        />
      </Section>

      {/* Conveyors */}
      <Section
        title="Conveyors"
        onClick={() => setCameraTarget('conveyors')}
        status={conveyorJam ? 'fault' : conveyorRunning ? 'running' : 'stopped'}
      >
        <div className={styles.row}>
          <ControlButton
            active={conveyorRunning}
            onClick={toggleConveyor}
            disabled={emergencyStop}
          >
            {conveyorRunning ? <Square size={12} /> : <Play size={12} />}
            Mainline
          </ControlButton>
          <ToggleButton active={conveyorDivert} onClick={toggleConveyorDivert}>
            Divert
          </ToggleButton>
        </div>
        {(conveyorJam || conveyorJamClearing) && (
          <ControlButton
            active={false}
            onClick={triggerJamClear}
            disabled={conveyorJamClearing}
            variant="warning"
          >
            <RotateCcw size={12} className={conveyorJamClearing ? styles.spin : ''} />
            {conveyorJamClearing ? 'Clearing…' : 'Clear Jam'}
          </ControlButton>
        )}
      </Section>

      {/* Safety */}
      <Section
        title="Safety"
        onClick={() => setCameraTarget('safety')}
        status={emergencyStop ? 'fault' : 'running'}
      >
        <div className={styles.row}>
          <button
            className={`${styles.eStop} ${emergencyStop ? styles.eStopActive : ''}`}
            onClick={emergencyStop ? resetEmergencyStop : triggerEmergencyStop}
          >
            <Zap size={16} />
            {emergencyStop ? 'RESET' : 'E-STOP'}
          </button>
          <ControlButton active={false} onClick={acknowledgeAlarm}>
            ACK Alarms
          </ControlButton>
        </div>
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title,
  children,
  status,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  status: 'running' | 'stopped' | 'warning' | 'fault';
  onClick?: () => void;
}) {
  const statusColor =
    status === 'running' ? '#6aad6a' :
    status === 'warning' ? '#d4955a' :
    status === 'fault' ? '#c45c5c' :
    '#5a6370';

  return (
    <div className={styles.section}>
      <button className={styles.sectionTitle} onClick={onClick}>
        <span className={styles.statusDot} style={{ background: statusColor }} />
        {title}
      </button>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function ControlButton({
  children,
  active,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'warning';
}) {
  return (
    <button
      className={`${styles.controlBtn} ${active ? styles.controlBtnActive : ''} ${variant === 'warning' ? styles.controlBtnWarning : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function ToggleButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`${styles.toggleBtn} ${active ? styles.toggleBtnActive : ''}`} onClick={onClick}>
      {active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
      {children}
    </button>
  );
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div className={styles.slider}>
      <div className={styles.sliderLabel}>
        <span>{label}</span>
        <span className={styles.sliderValue}>{Math.round(value)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
