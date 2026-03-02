import { create } from 'zustand';

/* ── Types ── */
export interface IncidentEntry {
  id: string;
  time: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
}

export type ShiftMode = 'day' | 'night';
export type CameraTarget = 'overview' | 'autostore' | 'depalletizer' | 'palletizer' | 'conveyors' | 'safety' | string;

export interface KPIs {
  throughput: number;
  backlog: number;
  missedCutoffs: number;
  utilization: number;
  downtimeMinutes: number;
}

export interface ControlRoomState {
  /* Machine states */
  depalletizerRunning: boolean;
  depalletizerSpeed: number;
  depalletizerFault: boolean;

  autostoreSpeed: number;
  autostoreHeatmap: boolean;
  autostoreBinDensity: number;

  palletizerRunning: boolean;
  palletizerPattern: 'A' | 'B';
  palletizerOutputRate: number;

  conveyorRunning: boolean;
  conveyorDivert: boolean;
  conveyorJam: boolean;
  conveyorJamClearing: boolean;

  emergencyStop: boolean;

  /* UI / Scene */
  shiftMode: ShiftMode;
  performanceMode: boolean;
  cameraTarget: CameraTarget;
  focusedProfile: string | null;

  /* KPIs */
  kpis: KPIs;

  /* Incidents */
  incidents: IncidentEntry[];

  /* Actions */
  toggleDepalletizer: () => void;
  setDepalletizerSpeed: (v: number) => void;
  toggleDepalletizerFault: () => void;

  setAutostoreSpeed: (v: number) => void;
  toggleAutostoreHeatmap: () => void;
  setAutostoreBinDensity: (v: number) => void;

  togglePalletizer: () => void;
  setPalletizerPattern: (p: 'A' | 'B') => void;
  setPalletizerOutputRate: (v: number) => void;

  toggleConveyor: () => void;
  toggleConveyorDivert: () => void;
  triggerJamClear: () => void;

  triggerEmergencyStop: () => void;
  resetEmergencyStop: () => void;
  acknowledgeAlarm: () => void;

  setShiftMode: (m: ShiftMode) => void;
  setPerformanceMode: (v: boolean) => void;
  setCameraTarget: (t: CameraTarget) => void;
  setFocusedProfile: (id: string | null) => void;

  addIncident: (msg: string, sev: IncidentEntry['severity']) => void;
  tick: () => void;
}

let incidentCounter = 0;
const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

export const useStore = create<ControlRoomState>((set, get) => ({
  depalletizerRunning: false,
  depalletizerSpeed: 60,
  depalletizerFault: false,

  autostoreSpeed: 100,
  autostoreHeatmap: false,
  autostoreBinDensity: 70,

  palletizerRunning: false,
  palletizerPattern: 'A',
  palletizerOutputRate: 80,

  conveyorRunning: true,
  conveyorDivert: false,
  conveyorJam: false,
  conveyorJamClearing: false,

  emergencyStop: false,

  shiftMode: 'day',
  performanceMode: false,
  cameraTarget: 'overview',
  focusedProfile: null,

  kpis: {
    throughput: 420,
    backlog: 38,
    missedCutoffs: 0,
    utilization: 72,
    downtimeMinutes: 0,
  },

  incidents: [
    { id: 'init-1', time: now(), message: 'System initialised — all stations nominal', severity: 'info', acknowledged: true },
  ],

  /* ── Actions ── */
  toggleDepalletizer: () => set(s => {
    const running = !s.depalletizerRunning;
    if (running && s.emergencyStop) return s;
    return { depalletizerRunning: running };
  }),
  setDepalletizerSpeed: (v) => set({ depalletizerSpeed: v }),
  toggleDepalletizerFault: () => set(s => {
    const fault = !s.depalletizerFault;
    const newIncidents = [...s.incidents];
    if (fault) {
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'FAULT: Depalletizer arm obstruction detected',
        severity: 'critical',
        acknowledged: false,
      });
    } else {
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'Depalletizer fault cleared',
        severity: 'info',
        acknowledged: false,
      });
    }
    return {
      depalletizerFault: fault,
      depalletizerRunning: fault ? false : s.depalletizerRunning,
      incidents: newIncidents.slice(0, 50),
    };
  }),

  setAutostoreSpeed: (v) => set(s => {
    const newIncidents = [...s.incidents];
    if (v > 160 && s.autostoreSpeed <= 160) {
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'WARNING: AutoStore speed exceeds safe threshold — jam risk elevated',
        severity: 'warning',
        acknowledged: false,
      });
    }
    return { autostoreSpeed: v, incidents: newIncidents.slice(0, 50) };
  }),
  toggleAutostoreHeatmap: () => set(s => ({ autostoreHeatmap: !s.autostoreHeatmap })),
  setAutostoreBinDensity: (v) => set({ autostoreBinDensity: v }),

  togglePalletizer: () => set(s => {
    if (s.emergencyStop) return s;
    return { palletizerRunning: !s.palletizerRunning };
  }),
  setPalletizerPattern: (p) => set({ palletizerPattern: p }),
  setPalletizerOutputRate: (v) => set({ palletizerOutputRate: v }),

  toggleConveyor: () => set(s => {
    if (s.emergencyStop) return s;
    return { conveyorRunning: !s.conveyorRunning };
  }),
  toggleConveyorDivert: () => set(s => ({ conveyorDivert: !s.conveyorDivert })),
  triggerJamClear: () => {
    const s = get();
    if (s.conveyorJamClearing) return;
    set({
      conveyorJam: false,
      conveyorJamClearing: true,
      conveyorRunning: false,
    });
    const newIncidents = [...s.incidents];
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'Conveyor jam clearing in progress…',
      severity: 'warning',
      acknowledged: false,
    });
    set({ incidents: newIncidents.slice(0, 50) });

    setTimeout(() => {
      const st = get();
      const incs = [...st.incidents];
      incs.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'Conveyor jam cleared — resuming',
        severity: 'info',
        acknowledged: false,
      });
      set({
        conveyorJamClearing: false,
        conveyorRunning: true,
        conveyorJam: false,
        incidents: incs.slice(0, 50),
      });
    }, 2500);
  },

  triggerEmergencyStop: () => set(s => {
    const newIncidents = [...s.incidents];
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'EMERGENCY STOP ACTIVATED — all systems halted',
      severity: 'critical',
      acknowledged: false,
    });
    return {
      emergencyStop: true,
      depalletizerRunning: false,
      palletizerRunning: false,
      conveyorRunning: false,
      incidents: newIncidents.slice(0, 50),
    };
  }),
  resetEmergencyStop: () => set(s => {
    const newIncidents = [...s.incidents];
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'Emergency stop reset — systems ready for restart',
      severity: 'info',
      acknowledged: false,
    });
    return { emergencyStop: false, incidents: newIncidents.slice(0, 50) };
  }),
  acknowledgeAlarm: () => set(s => ({
    incidents: s.incidents.map(inc => ({ ...inc, acknowledged: true })),
  })),

  setShiftMode: (m) => set({ shiftMode: m }),
  setPerformanceMode: (v) => set({ performanceMode: v }),
  setCameraTarget: (t) => set({ cameraTarget: t }),
  setFocusedProfile: (id) => set({ focusedProfile: id }),

  addIncident: (msg, sev) => set(s => {
    const newIncidents = [...s.incidents];
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: msg,
      severity: sev,
      acknowledged: false,
    });
    return { incidents: newIncidents.slice(0, 50) };
  }),

  /* Simulation tick — called on rAF from scene */
  tick: () => set(s => {
    if (s.emergencyStop) {
      return {
        kpis: {
          ...s.kpis,
          downtimeMinutes: s.kpis.downtimeMinutes + 0.016,
          throughput: Math.max(0, s.kpis.throughput - 2),
        },
      };
    }

    const conveyorFactor = s.conveyorRunning ? 1 : 0;
    const depalFactor = s.depalletizerRunning ? (s.depalletizerSpeed / 100) : 0;
    const palFactor = s.palletizerRunning ? (s.palletizerOutputRate / 100) : 0;
    const asFactor = s.autostoreSpeed / 100;
    const faultPenalty = s.depalletizerFault ? 0.3 : 0;

    const targetThroughput = Math.round(
      420 * ((conveyorFactor * 0.3) + (depalFactor * 0.25) + (palFactor * 0.25) + (asFactor * 0.2)) * (1 - faultPenalty)
    );
    const newThroughput = s.kpis.throughput + (targetThroughput - s.kpis.throughput) * 0.02;

    const targetUtil = Math.round(
      (conveyorFactor * 25 + (s.depalletizerRunning ? 25 : 0) + (s.palletizerRunning ? 25 : 0) + (asFactor * 25)) * (1 - faultPenalty)
    );
    const newUtil = s.kpis.utilization + (targetUtil - s.kpis.utilization) * 0.02;

    const backlogDelta = s.conveyorRunning ? -0.05 : 0.1;
    const newBacklog = Math.max(0, Math.min(200, s.kpis.backlog + backlogDelta));

    const downDelta = (!s.conveyorRunning || s.depalletizerFault || s.conveyorJam) ? 0.016 : 0;

    // Randomly simulate jam if autostore speed too high
    let newJam = s.conveyorJam;
    if (s.autostoreSpeed > 160 && s.conveyorRunning && !s.conveyorJam && !s.conveyorJamClearing && Math.random() < 0.001) {
      newJam = true;
    }

    return {
      conveyorJam: newJam,
      kpis: {
        throughput: Math.round(newThroughput),
        backlog: Math.round(newBacklog),
        missedCutoffs: s.kpis.missedCutoffs + (newBacklog > 150 ? 0.01 : 0),
        utilization: Math.round(newUtil),
        downtimeMinutes: Math.round((s.kpis.downtimeMinutes + downDelta) * 100) / 100,
      },
    };
  }),
}));
