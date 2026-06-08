export type CultureKey = 'mandioca' | 'pastagem_leite' | 'pastagem_corte' | 'milho' | 'soja' | 'cana';
export type RecommendationKey = 'calagem' | 'gessagem' | 'camaFrango' | 'fosforo' | 'potassio' | 'micros';
export type LimeMethod = 'ca_ctc' | 'v_percent' | 'ca_absoluto';
export type LimeSource = 'magnesiano' | 'dolomitico' | 'calcitico';
export type Status = 'Baixo' | 'Médio' | 'Alto' | 'Muito alto' | 'Adequado' | 'Crítico' | 'Não classificado';

export interface SoilRow {
  nutrient: string;
  unit: string;
  value: number;
  originalName: string;
}

export interface SoilAnalysis {
  rows: SoilRow[];
  values: Record<string, number>;
  units: Record<string, string>;
  fileName?: string;
}

export interface RangeRule {
  lowMax: number;
  mediumMax: number;
  highMax?: number;
  inverse?: boolean;
  unit: string;
  label?: string;
}

export interface InterpretationItem {
  key: string;
  nutrient: string;
  unit: string;
  value: number;
  status: Status;
  min: number;
  lowMax: number;
  mediumMax: number;
  max: number;
  percent: number;
  inverse?: boolean;
}

export interface CultureProfile {
  key: CultureKey;
  name: string;
  targetV: number;
  targetCaCtc: number;
  targetCaAbsolute: number;
  nDemandKgHa: number;
  p2o5: { low: number; medium: number; high: number };
  k2o: { low: number; medium: number; high: number };
  micros: { product: string; doseKgHa: number; note: string };
  notes: string[];
}

export interface CalcOptions {
  selectedRecommendations: RecommendationKey[];
  limeMethod: LimeMethod;
  limeSource: LimeSource;
  prnt: number;
  targetV: number;
  targetCaAbsolute: number;
  poultryNPercent: number;
  poultryEfficiency: number;
}

export interface RecommendationResult {
  key: RecommendationKey;
  title: string;
  dose: string;
  source?: string;
  formula?: string;
  details: string[];
  warning?: string;
}
