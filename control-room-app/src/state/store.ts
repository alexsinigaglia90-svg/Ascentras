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
export type ScenarioMode = 'baseline' | 'peak-hour' | 'jam-cascade' | 'night-shift';
export type CameraTarget = 'overview' | 'autostore' | 'depalletizer' | 'palletizer' | 'conveyors' | 'safety' | string;

export interface KPIs {
  throughput: number;
  backlog: number;
  missedCutoffs: number;
  utilization: number;
  downtimeMinutes: number;
}

export interface ScenarioRun {
  id: string;
  mode: ScenarioMode;
  startTime: string;
  endTime: string | null;
  startKpis: KPIs;
  endKpis: KPIs | null;
}

export interface ControlRoomState {
  /* Machine states */
  depalletizerRunning: boolean;
  depalletizerSpeed: number;
  depalletizerFault: boolean;

  /* Pallet tracking — boxes remaining on active pallet */
  palletBoxesRemaining: number;        // 0-18 (3 layers × 6 boxes)
  palletBufferCount: number;           // 0-3 pallets queued in buffer lane
  palletBufferMax: number;             // max 3
  palletReplenishRequested: boolean;   // control room notification active
  palletEmpty: boolean;                // pallet fully unstacked

  /* AMR fleet */
  amrCount: number;
  amrDelivering: boolean;              // an AMR is en-route with pallet
  amrWaiting: boolean;                 // AMR waiting because buffer full

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
  scenarioMode: ScenarioMode;
  performanceMode: boolean;
  cameraTarget: CameraTarget;
  focusedProfile: string | null;

  /* KPIs */
  kpis: KPIs;

  /* Scenario replay */
  scenarioRuns: ScenarioRun[];
  replayCursor: number;

  /* Incidents */
  incidents: IncidentEntry[];

  /* Actions */
  toggleDepalletizer: () => void;
  setDepalletizerSpeed: (v: number) => void;
  toggleDepalletizerFault: () => void;

  /* Pallet / AMR actions */
  removeBoxFromPallet: () => void;     // called by depal animation cycle
  requestReplenishment: () => void;    // user clicks "request pallet"
  dispatchAmr: () => void;             // send AMR with new pallet
  loadPalletFromBuffer: () => void;    // move buffer pallet to depal

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
  applyScenario: (mode: ScenarioMode) => void;
  setReplayCursor: (index: number) => void;
  clearScenarioRuns: () => void;
  setPerformanceMode: (v: boolean) => void;
  setCameraTarget: (t: CameraTarget) => void;
  setFocusedProfile: (id: string | null) => void;

  addIncident: (msg: string, sev: IncidentEntry['severity']) => void;
  tick: () => void;
}

let incidentCounter = 0;
let scenarioRunCounter = 0;
const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const cloneKpis = (kpis: KPIs): KPIs => ({
  throughput: kpis.throughput,
  backlog: kpis.backlog,
  missedCutoffs: kpis.missedCutoffs,
  utilization: kpis.utilization,
  downtimeMinutes: kpis.downtimeMinutes,
});

const scenarioProfile: Record<ScenarioMode, {
  throughputBias: number;
  backlogDrift: number;
  jamRisk: number;
  amrDispatchBoost: number;
}> = {
  baseline: {
    throughputBias: 1,
    backlogDrift: 0,
    jamRisk: 1,
    amrDispatchBoost: 1,
  },
  'peak-hour': {
    throughputBias: 1.08,
    backlogDrift: 0.035,
    jamRisk: 1.25,
    amrDispatchBoost: 1.45,
  },
  'jam-cascade': {
    throughputBias: 0.82,
    backlogDrift: 0.12,
    jamRisk: 2.2,
    amrDispatchBoost: 0.9,
  },
  'night-shift': {
    throughputBias: 0.9,
    backlogDrift: 0.05,
    jamRisk: 1.35,
    amrDispatchBoost: 0.85,
  },
};

export const useStore = create<ControlRoomState>((set, get) => ({
  depalletizerRunning: false,
  depalletizerSpeed: 60,
  depalletizerFault: false,

  palletBoxesRemaining: 18,
  palletBufferCount: 2,
  palletBufferMax: 3,
  palletReplenishRequested: false,
  palletEmpty: false,

  amrCount: 3,
  amrDelivering: false,
  amrWaiting: false,

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
  scenarioMode: 'baseline',
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

  scenarioRuns: [
    {
      id: `run-${++scenarioRunCounter}`,
      mode: 'baseline',
      startTime: now(),
      endTime: null,
      startKpis: {
        throughput: 420,
        backlog: 38,
        missedCutoffs: 0,
        utilization: 72,
        downtimeMinutes: 0,
      },
      endKpis: {
        throughput: 420,
        backlog: 38,
        missedCutoffs: 0,
        utilization: 72,
        downtimeMinutes: 0,
      },
    },
  ],
  replayCursor: 0,

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

  /* ── Pallet / AMR Actions ── */
  removeBoxFromPallet: () => set(s => {
    if (s.palletBoxesRemaining <= 0) return s;
    const remaining = s.palletBoxesRemaining - 1;
    const empty = remaining === 0;
    const newIncidents = [...s.incidents];
    if (empty) {
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'PALLET EMPTY — replenishment required',
        severity: 'warning',
        acknowledged: false,
      });
    }
    return {
      palletBoxesRemaining: remaining,
      palletEmpty: empty,
      palletReplenishRequested: empty ? true : s.palletReplenishRequested,
      depalletizerRunning: empty ? false : s.depalletizerRunning,
      incidents: empty ? newIncidents.slice(0, 50) : s.incidents,
    };
  }),

  requestReplenishment: () => set(s => {
    if (s.amrDelivering || !s.palletReplenishRequested) return s;
    const newIncidents = [...s.incidents];
    if (s.palletBufferCount > 0) {
      // Load from buffer immediately
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'Loading pallet from buffer lane — depal restarting',
        severity: 'info',
        acknowledged: false,
      });
      return {
        palletBoxesRemaining: 18,
        palletEmpty: false,
        palletReplenishRequested: false,
        palletBufferCount: s.palletBufferCount - 1,
        incidents: newIncidents.slice(0, 50),
      };
    }
    // Dispatch AMR
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'AMR dispatched — fetching new pallet from warehouse',
      severity: 'info',
      acknowledged: false,
    });
    return {
      amrDelivering: true,
      incidents: newIncidents.slice(0, 50),
    };
  }),

  dispatchAmr: () => set(s => {
    if (s.amrDelivering) return s;
    const newIncidents = [...s.incidents];
    if (s.palletBufferCount >= s.palletBufferMax) {
      newIncidents.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'BUFFER FULL — AMR waiting for slot',
        severity: 'warning',
        acknowledged: false,
      });
      return { amrWaiting: true, incidents: newIncidents.slice(0, 50) };
    }
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'AMR dispatched to buffer lane',
      severity: 'info',
      acknowledged: false,
    });
    return { amrDelivering: true, incidents: newIncidents.slice(0, 50) };
  }),

  loadPalletFromBuffer: () => set(s => {
    if (s.palletBufferCount <= 0 || !s.palletEmpty) return s;
    const newIncidents = [...s.incidents];
    newIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: now(),
      message: 'Buffer pallet loaded to depal — resuming operation',
      severity: 'info',
      acknowledged: false,
    });
    return {
      palletBoxesRemaining: 18,
      palletEmpty: false,
      palletReplenishRequested: false,
      palletBufferCount: s.palletBufferCount - 1,
      amrWaiting: s.palletBufferCount - 1 < s.palletBufferMax ? false : s.amrWaiting,
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
  applyScenario: (mode) => set(s => {
    const nextIncidents = [...s.incidents];
    const scenarioNow = now();

    const basePatch: Partial<ControlRoomState> = {
      emergencyStop: false,
      scenarioMode: mode,
      conveyorJam: false,
      conveyorJamClearing: false,
    };

    const modePatch: Partial<ControlRoomState> =
      mode === 'peak-hour'
        ? {
            shiftMode: 'day',
            depalletizerRunning: true,
            depalletizerSpeed: 98,
            palletizerRunning: true,
            palletizerOutputRate: 108,
            conveyorRunning: true,
            autostoreSpeed: 132,
            autostoreBinDensity: 82,
          }
        : mode === 'jam-cascade'
        ? {
            shiftMode: 'day',
            depalletizerRunning: true,
            depalletizerSpeed: 88,
            palletizerRunning: true,
            palletizerOutputRate: 86,
            conveyorRunning: true,
            autostoreSpeed: 176,
            autostoreBinDensity: 92,
            amrWaiting: false,
          }
        : mode === 'night-shift'
        ? {
            shiftMode: 'night',
            depalletizerRunning: true,
            depalletizerSpeed: 72,
            palletizerRunning: true,
            palletizerOutputRate: 72,
            conveyorRunning: true,
            autostoreSpeed: 82,
            autostoreBinDensity: 64,
          }
        : {
            shiftMode: 'day',
            depalletizerRunning: false,
            depalletizerSpeed: 60,
            palletizerRunning: false,
            palletizerOutputRate: 80,
            conveyorRunning: true,
            autostoreSpeed: 100,
            autostoreBinDensity: 70,
            amrWaiting: false,
          };

    nextIncidents.unshift({
      id: `inc-${++incidentCounter}`,
      time: scenarioNow,
      message: `Scenario switched to ${mode.replace('-', ' ')}.`,
      severity: mode === 'jam-cascade' ? 'warning' : 'info',
      acknowledged: false,
    });

    const runs = [...s.scenarioRuns];
    if (runs.length > 0) {
      const last = runs[runs.length - 1];
      runs[runs.length - 1] = {
        ...last,
        endTime: scenarioNow,
        endKpis: cloneKpis(s.kpis),
      };
    }

    runs.push({
      id: `run-${++scenarioRunCounter}`,
      mode,
      startTime: scenarioNow,
      endTime: null,
      startKpis: cloneKpis(s.kpis),
      endKpis: cloneKpis(s.kpis),
    });

    const trimmedRuns = runs.slice(-30);

    return {
      ...basePatch,
      ...modePatch,
      incidents: nextIncidents.slice(0, 50),
      scenarioRuns: trimmedRuns,
      replayCursor: trimmedRuns.length - 1,
    };
  }),
  setReplayCursor: (index) => set(s => {
    const maxIndex = Math.max(0, s.scenarioRuns.length - 1);
    return { replayCursor: Math.max(0, Math.min(maxIndex, Math.round(index))) };
  }),
  clearScenarioRuns: () => set(s => {
    const resetNow = now();
    return {
      scenarioRuns: [{
        id: `run-${++scenarioRunCounter}`,
        mode: s.scenarioMode,
        startTime: resetNow,
        endTime: null,
        startKpis: cloneKpis(s.kpis),
        endKpis: cloneKpis(s.kpis),
      }],
      replayCursor: 0,
    };
  }),
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
      const emergencyKpis = {
        ...s.kpis,
        downtimeMinutes: s.kpis.downtimeMinutes + 0.016,
        throughput: Math.max(0, s.kpis.throughput - 2),
      };
      const emergencyRuns = [...s.scenarioRuns];
      if (emergencyRuns.length > 0) {
        const idx = emergencyRuns.length - 1;
        emergencyRuns[idx] = {
          ...emergencyRuns[idx],
          endKpis: cloneKpis(emergencyKpis),
        };
      }
      return {
        kpis: emergencyKpis,
        scenarioRuns: emergencyRuns,
      };
    }

    const scenario = scenarioProfile[s.scenarioMode];

    const conveyorFactor = s.conveyorRunning ? 1 : 0;
    const depalFactor = s.depalletizerRunning ? (s.depalletizerSpeed / 100) : 0;
    const palFactor = s.palletizerRunning ? (s.palletizerOutputRate / 100) : 0;
    const asFactor = s.autostoreSpeed / 100;
    const faultPenalty = s.depalletizerFault ? 0.3 : 0;

    const targetThroughput = Math.round(
      420 * ((conveyorFactor * 0.3) + (depalFactor * 0.25) + (palFactor * 0.25) + (asFactor * 0.2)) * (1 - faultPenalty) * scenario.throughputBias
    );
    const newThroughput = s.kpis.throughput + (targetThroughput - s.kpis.throughput) * 0.02;

    const targetUtil = Math.round(
      (conveyorFactor * 25 + (s.depalletizerRunning ? 25 : 0) + (s.palletizerRunning ? 25 : 0) + (asFactor * 25)) * (1 - faultPenalty)
    );
    const newUtil = s.kpis.utilization + (targetUtil - s.kpis.utilization) * 0.02;

    const backlogDelta = (s.conveyorRunning ? -0.05 : 0.1) + scenario.backlogDrift;
    const newBacklog = Math.max(0, Math.min(200, s.kpis.backlog + backlogDelta));

    const downDelta = (!s.conveyorRunning || s.depalletizerFault || s.conveyorJam) ? 0.016 : 0;

    const tickIncs = [...s.incidents];

    // Randomly simulate jam if autostore speed too high
    let newJam = s.conveyorJam;
    if (s.autostoreSpeed > 160 && s.conveyorRunning && !s.conveyorJam && !s.conveyorJamClearing && Math.random() < 0.001 * scenario.jamRisk) {
      newJam = true;
    }
    if (s.scenarioMode === 'jam-cascade' && s.conveyorRunning && !newJam && Math.random() < 0.0024) {
      newJam = true;
      tickIncs.unshift({
        id: `inc-${++incidentCounter}`,
        time: now(),
        message: 'CASCADE: queue surge triggered a secondary conveyor jam',
        severity: 'warning',
        acknowledged: false,
      });
    }

    // AMR delivery simulation — completes after ~8 seconds (0.5% chance per tick)
    let amrDelivering = s.amrDelivering;
    let bufferCount = s.palletBufferCount;
    let amrWaiting = s.amrWaiting;
    let palletBoxes = s.palletBoxesRemaining;
    let palletEmpty = s.palletEmpty;
    let replenishReq = s.palletReplenishRequested;

    if (amrDelivering && Math.random() < 0.005) {
      amrDelivering = false;
      if (bufferCount < s.palletBufferMax) {
        bufferCount += 1;
        tickIncs.unshift({
          id: `inc-${++incidentCounter}`,
          time: now(),
          message: `AMR delivered pallet to buffer (${bufferCount}/${s.palletBufferMax})`,
          severity: 'info',
          acknowledged: false,
        });
        // Auto-load if pallet is empty and buffer just got stock
        if (palletEmpty && bufferCount > 0) {
          palletBoxes = 18;
          palletEmpty = false;
          replenishReq = false;
          bufferCount -= 1;
          tickIncs.unshift({
            id: `inc-${++incidentCounter}`,
            time: now(),
            message: 'Auto-loaded pallet from buffer — depal ready',
            severity: 'info',
            acknowledged: false,
          });
        }
      }
    }

    // Auto-dispatch AMR if buffer below max and not already delivering
    if (!amrDelivering && bufferCount < s.palletBufferMax && Math.random() < 0.002 * scenario.amrDispatchBoost) {
      amrDelivering = true;
    }

    // Release waiting AMR if buffer has space
    if (amrWaiting && bufferCount < s.palletBufferMax) {
      amrWaiting = false;
    }

    const nextKpis = {
      throughput: Math.round(newThroughput),
      backlog: Math.round(newBacklog),
      missedCutoffs: s.kpis.missedCutoffs + (newBacklog > 150 ? 0.01 : 0),
      utilization: Math.round(newUtil),
      downtimeMinutes: Math.round((s.kpis.downtimeMinutes + downDelta) * 100) / 100,
    };

    const nextRuns = [...s.scenarioRuns];
    if (nextRuns.length > 0) {
      const idx = nextRuns.length - 1;
      nextRuns[idx] = {
        ...nextRuns[idx],
        endKpis: cloneKpis(nextKpis),
      };
    }

    return {
      conveyorJam: newJam,
      amrDelivering,
      amrWaiting,
      palletBufferCount: bufferCount,
      palletBoxesRemaining: palletBoxes,
      palletEmpty,
      palletReplenishRequested: replenishReq,
      incidents: tickIncs.slice(0, 50),
      kpis: nextKpis,
      scenarioRuns: nextRuns,
    };
  }),
}));
