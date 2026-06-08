import { CultureKey, CultureProfile, RangeRule } from './types';

export const CULTURES: CultureProfile[] = [
  {
    key: 'mandioca',
    name: 'Mandioca',
    targetV: 50,
    targetCaCtc: 60,
    targetCaAbsolute: 2.0,
    nDemandKgHa: 40,
    p2o5: { low: 80, medium: 50, high: 20 },
    k2o: { low: 80, medium: 50, high: 30 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 30, note: 'Aplicar quando houver deficiência de micronutrientes.' },
    notes: ['Perfil inicial baseado em recomendações gerais da Embrapa para mandioca. Ajuste por região e produtividade esperada.']
  },
  {
    key: 'pastagem_leite',
    name: 'Pastagem para leite',
    targetV: 60,
    targetCaCtc: 60,
    targetCaAbsolute: 2.5,
    nDemandKgHa: 120,
    p2o5: { low: 100, medium: 70, high: 40 },
    k2o: { low: 100, medium: 70, high: 40 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 30, note: 'Usar em implantação ou quando houver deficiência diagnosticada.' },
    notes: ['Leite foi tratado como sistema de maior exigência tecnológica. Refinar posteriormente por espécie forrageira e lotação.']
  },
  {
    key: 'pastagem_corte',
    name: 'Pastagem para gado de corte',
    targetV: 50,
    targetCaCtc: 60,
    targetCaAbsolute: 2.0,
    nDemandKgHa: 60,
    p2o5: { low: 70, medium: 45, high: 25 },
    k2o: { low: 70, medium: 45, high: 25 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 20, note: 'Usar em implantação ou deficiência confirmada.' },
    notes: ['Corte foi tratado como sistema de média exigência tecnológica. Ajuste conforme espécie, manejo e taxa de lotação.']
  },
  {
    key: 'milho',
    name: 'Milho',
    targetV: 60,
    targetCaCtc: 60,
    targetCaAbsolute: 2.5,
    nDemandKgHa: 120,
    p2o5: { low: 100, medium: 70, high: 40 },
    k2o: { low: 100, medium: 70, high: 50 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 30, note: 'Aplicar em área com deficiência de micronutrientes.' },
    notes: ['Para milho, ajustar N, P e K pela expectativa de produtividade e histórico da área.']
  },
  {
    key: 'soja',
    name: 'Soja',
    targetV: 60,
    targetCaCtc: 60,
    targetCaAbsolute: 2.0,
    nDemandKgHa: 0,
    p2o5: { low: 90, medium: 60, high: 30 },
    k2o: { low: 90, medium: 60, high: 30 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 30, note: 'Usar quando B, Cu, Mn ou Zn estiverem baixos.' },
    notes: ['Soja depende da fixação biológica de N. Evite recomendar cama de frango somente pelo N sem avaliar P, K, salinidade e legislação local.']
  },
  {
    key: 'cana',
    name: 'Cana-de-açúcar',
    targetV: 60,
    targetCaCtc: 60,
    targetCaAbsolute: 2.5,
    nDemandKgHa: 100,
    p2o5: { low: 120, medium: 80, high: 50 },
    k2o: { low: 140, medium: 100, high: 60 },
    micros: { product: 'FTE BR-12 ou formulação equivalente', doseKgHa: 30, note: 'Perfil conservador. Ajustar conforme manual regional da cana.' },
    notes: ['Cana possui recomendação regionalizada. Este perfil é um MVP e deve ser ajustado por estado, produtividade e ciclo.']
  }
];

export const PROFILE_BY_KEY = Object.fromEntries(CULTURES.map((c) => [c.key, c])) as Record<CultureKey, CultureProfile>;

export const LIME_SOURCES = {
  magnesiano: { label: 'Calcário magnesiano', cao: 32 },
  dolomitico: { label: 'Calcário dolomítico', cao: 30 },
  calcitico: { label: 'Calcário calcítico', cao: 45 }
};

// Faixas gerais para releitura visual. Ajuste conforme região, extrator e manual usado.
export const INTERPRETATION_RULES: Record<string, RangeRule> = {
  ph: { lowMax: 5.0, mediumMax: 5.8, highMax: 7.0, unit: 'pH' },
  mo: { lowMax: 15, mediumMax: 30, highMax: 50, unit: 'g/dm³' },
  p: { lowMax: 8, mediumMax: 18, highMax: 40, unit: 'mg/dm³' },
  s: { lowMax: 5, mediumMax: 10, highMax: 25, unit: 'mg/dm³' },
  al: { lowMax: 2, mediumMax: 5, highMax: 10, inverse: true, unit: 'mmolc/dm³' },
  k: { lowMax: 1.5, mediumMax: 3.0, highMax: 6.0, unit: 'mmolc/dm³' },
  ca: { lowMax: 15, mediumMax: 30, highMax: 60, unit: 'mmolc/dm³' },
  mg: { lowMax: 5, mediumMax: 10, highMax: 25, unit: 'mmolc/dm³' },
  sb: { lowMax: 20, mediumMax: 45, highMax: 80, unit: 'mmolc/dm³' },
  ctc: { lowMax: 40, mediumMax: 80, highMax: 140, unit: 'mmolc/dm³' },
  v: { lowMax: 40, mediumMax: 60, highMax: 80, unit: '%' },
  m: { lowMax: 10, mediumMax: 20, highMax: 50, inverse: true, unit: '%' },
  b: { lowMax: 0.2, mediumMax: 0.6, highMax: 1.0, unit: 'mg/dm³' },
  cu: { lowMax: 0.4, mediumMax: 0.8, highMax: 2.0, unit: 'mg/dm³' },
  fe: { lowMax: 12, mediumMax: 30, highMax: 80, unit: 'mg/dm³' },
  mn: { lowMax: 5, mediumMax: 15, highMax: 50, unit: 'mg/dm³' },
  zn: { lowMax: 0.8, mediumMax: 1.5, highMax: 5, unit: 'mg/dm³' },
  argila: { lowMax: 150, mediumMax: 350, highMax: 600, unit: 'g/kg' },
  areia: { lowMax: 300, mediumMax: 600, highMax: 900, unit: 'g/kg' },
  silte: { lowMax: 100, mediumMax: 300, highMax: 600, unit: 'g/kg' }
};
