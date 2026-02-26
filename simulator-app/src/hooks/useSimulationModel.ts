import { useEffect, useMemo, useRef, useState } from 'react';

export type StorageModel = 'High Density' | 'High Accessibility' | 'Hybrid';
export type FulfilmentLogic = 'Wave' | 'Continuous Flow' | 'Batch';
export type AutomationLevel = 'Labour Driven' | 'Selective Automation' | 'Mechanization Heavy';

export type DecisionField = 'storageModel' | 'fulfilmentLogic' | 'automationLevel';

export type DesignState = {
  storageModel: StorageModel;
  fulfilmentLogic: FulfilmentLogic;
  automationLevel: AutomationLevel;
};

export type Metrics = {
  throughput: number;
  costIndex: number;
  congestionRisk: number;
  scalability: number;
  laborSensitivity: number;
  efficiencyIndex: number;
};

export const STORAGE_OPTIONS: StorageModel[] = ['High Density', 'High Accessibility', 'Hybrid'];
export const FULFILMENT_OPTIONS: FulfilmentLogic[] = ['Wave', 'Continuous Flow', 'Batch'];
export const AUTOMATION_OPTIONS: AutomationLevel[] = ['Labour Driven', 'Selective Automation', 'Mechanization Heavy'];

const BASELINE: Omit<Metrics, 'efficiencyIndex'> = {
  throughput: 58,
  costIndex: 52,
  congestionRisk: 50,
  scalability: 56,
  laborSensitivity: 54
};

const EFFECTS: Record<DecisionField, Record<string, Omit<Metrics, 'efficiencyIndex'>>> = {
  storageModel: {
    'High Density': { throughput: 9, costIndex: -6, congestionRisk: 11, scalability: 6, laborSensitivity: 8 },
    'High Accessibility': { throughput: 11, costIndex: 7, congestionRisk: -6, scalability: 5, laborSensitivity: -2 },
    Hybrid: { throughput: 8, costIndex: 1, congestionRisk: 2, scalability: 9, laborSensitivity: 1 }
  },
  fulfilmentLogic: {
    Wave: { throughput: 6, costIndex: -2, congestionRisk: 8, scalability: 3, laborSensitivity: 5 },
    'Continuous Flow': { throughput: 12, costIndex: 4, congestionRisk: -4, scalability: 9, laborSensitivity: -1 },
    Batch: { throughput: 4, costIndex: -5, congestionRisk: 4, scalability: 5, laborSensitivity: 6 }
  },
  automationLevel: {
    'Labour Driven': { throughput: -5, costIndex: -11, congestionRisk: 9, scalability: -4, laborSensitivity: 13 },
    'Selective Automation': { throughput: 8, costIndex: 2, congestionRisk: -4, scalability: 9, laborSensitivity: -6 },
    'Mechanization Heavy': { throughput: 15, costIndex: 12, congestionRisk: -9, scalability: 13, laborSensitivity: -12 }
  }
};

export const DEFAULT_DESIGN: DesignState = {
  storageModel: 'Hybrid',
  fulfilmentLogic: 'Continuous Flow',
  automationLevel: 'Selective Automation'
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withEfficiency(metrics: Omit<Metrics, 'efficiencyIndex'>): Metrics {
  const efficiencyIndex =
    metrics.throughput * 0.3 +
    metrics.scalability * 0.25 +
    (100 - metrics.costIndex) * 0.2 +
    (100 - metrics.congestionRisk) * 0.15 +
    (100 - metrics.laborSensitivity) * 0.1;

  return { ...metrics, efficiencyIndex };
}

export function calculateMetrics(design: DesignState): Metrics {
  const totals: Omit<Metrics, 'efficiencyIndex'> = { ...BASELINE };

  (Object.keys(design) as DecisionField[]).forEach((field) => {
    const option = design[field];
    const effect = EFFECTS[field][option];
    totals.throughput += effect.throughput;
    totals.costIndex += effect.costIndex;
    totals.congestionRisk += effect.congestionRisk;
    totals.scalability += effect.scalability;
    totals.laborSensitivity += effect.laborSensitivity;
  });

  totals.throughput = clamp(totals.throughput, 25, 100);
  totals.costIndex = clamp(totals.costIndex, 15, 100);
  totals.congestionRisk = clamp(totals.congestionRisk, 10, 100);
  totals.scalability = clamp(totals.scalability, 25, 100);
  totals.laborSensitivity = clamp(totals.laborSensitivity, 8, 100);

  return withEfficiency(totals);
}

function isSameDesign(left: DesignState, right: DesignState): boolean {
  return (
    left.storageModel === right.storageModel &&
    left.fulfilmentLogic === right.fulfilmentLogic &&
    left.automationLevel === right.automationLevel
  );
}

function bruteForceBestDesign(humanDesign: DesignState, humanMetrics: Metrics): { design: DesignState; metrics: Metrics } {
  const allCombinations: DesignState[] = [];

  STORAGE_OPTIONS.forEach((storageModel) => {
    FULFILMENT_OPTIONS.forEach((fulfilmentLogic) => {
      AUTOMATION_OPTIONS.forEach((automationLevel) => {
        allCombinations.push({ storageModel, fulfilmentLogic, automationLevel });
      });
    });
  });

  const ranked = allCombinations
    .map((design) => ({ design, metrics: calculateMetrics(design) }))
    .sort((a, b) => b.metrics.efficiencyIndex - a.metrics.efficiencyIndex);

  const best = ranked[0];

  if (best.metrics.efficiencyIndex > humanMetrics.efficiencyIndex) {
    return best;
  }

  const tieDifferent = ranked.find(
    (candidate) =>
      candidate.metrics.efficiencyIndex >= humanMetrics.efficiencyIndex &&
      !isSameDesign(candidate.design, humanDesign)
  );

  return tieDifferent ?? best;
}

export function useSimulationModel() {
  const [humanDesign, setHumanDesign] = useState<DesignState>(DEFAULT_DESIGN);
  const [botDesign, setBotDesign] = useState<DesignState>(DEFAULT_DESIGN);
  const [humanMetrics, setHumanMetrics] = useState<Metrics>(() => calculateMetrics(DEFAULT_DESIGN));
  const [botMetrics, setBotMetrics] = useState<Metrics>(() => calculateMetrics(DEFAULT_DESIGN));
  const [botThinking, setBotThinking] = useState(false);
  const [botPulseKey, setBotPulseKey] = useState(0);

  const timeoutRef = useRef<number | null>(null);

  const botStatus = useMemo(
    () => (botThinking ? 'Evaluating…' : `Resolved · ${botMetrics.efficiencyIndex.toFixed(1)} index`),
    [botThinking, botMetrics.efficiencyIndex]
  );

  useEffect(() => {
    setHumanMetrics(calculateMetrics(humanDesign));
  }, [humanDesign]);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setBotThinking(true);

    timeoutRef.current = window.setTimeout(() => {
      const best = bruteForceBestDesign(humanDesign, humanMetrics);
      setBotDesign(best.design);
      setBotMetrics(best.metrics);
      setBotThinking(false);
      setBotPulseKey((value) => value + 1);
    }, 600);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [humanDesign, humanMetrics]);

  const setDecision = (field: DecisionField, value: string) => {
    setHumanDesign((current) => ({ ...current, [field]: value } as DesignState));
  };

  const reset = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    const metrics = calculateMetrics(DEFAULT_DESIGN);
    setHumanDesign(DEFAULT_DESIGN);
    setBotDesign(DEFAULT_DESIGN);
    setHumanMetrics(metrics);
    setBotMetrics(metrics);
    setBotThinking(false);
    setBotPulseKey((value) => value + 1);
  };

  return {
    humanDesign,
    botDesign,
    humanMetrics,
    botMetrics,
    botStatus,
    botThinking,
    botPulseKey,
    setDecision,
    reset
  };
}
