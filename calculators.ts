import { CalcOptions, CultureProfile, InterpretationItem, RecommendationResult, SoilAnalysis, Status } from './types';
import { INTERPRETATION_RULES, LIME_SOURCES } from './profiles';
import { getCmol, getValue } from './parser';

const round = (v: number, d = 2) => Number.isFinite(v) ? Number(v.toFixed(d)) : 0;
const positive = (v: number) => Math.max(0, v);

function classify(value: number, lowMax: number, mediumMax: number, inverse?: boolean): Status {
  if (!inverse) {
    if (value <= lowMax) return 'Baixo';
    if (value <= mediumMax) return 'Médio';
    return 'Alto';
  }
  if (value <= lowMax) return 'Adequado';
  if (value <= mediumMax) return 'Médio';
  return 'Crítico';
}

export function interpretSoil(analysis: SoilAnalysis): InterpretationItem[] {
  return analysis.rows
    .filter((row) => INTERPRETATION_RULES[row.nutrient])
    .map((row) => {
      const rule = INTERPRETATION_RULES[row.nutrient];
      const max = rule.highMax ?? rule.mediumMax * 1.6;
      const percent = Math.max(0, Math.min(100, (row.value / max) * 100));
      return {
        key: row.nutrient,
        nutrient: row.originalName,
        unit: row.unit || rule.unit,
        value: row.value,
        status: classify(row.value, rule.lowMax, rule.mediumMax, rule.inverse),
        min: 0,
        lowMax: rule.lowMax,
        mediumMax: rule.mediumMax,
        max,
        percent,
        inverse: rule.inverse
      };
    });
}

function nutrientClass(analysis: SoilAnalysis, key: string): 'low' | 'medium' | 'high' {
  const value = getValue(analysis, key);
  const rule = INTERPRETATION_RULES[key];
  if (value === undefined || !rule) return 'medium';
  if (value <= rule.lowMax) return 'low';
  if (value <= rule.mediumMax) return 'medium';
  return 'high';
}

export function calculateRecommendations(analysis: SoilAnalysis, profile: CultureProfile, options: CalcOptions): RecommendationResult[] {
  const results: RecommendationResult[] = [];
  const ctc = getCmol(analysis, 'ctc') ?? 0;
  const ca = getCmol(analysis, 'ca') ?? 0;
  const v1 = getValue(analysis, 'v') ?? 0;
  const prnt = options.prnt > 0 ? options.prnt : 85;

  if (options.selectedRecommendations.includes('calagem')) {
    const lime = LIME_SOURCES[options.limeSource];
    let nc = 0;
    let formula = '';
    const targetV = options.targetV || profile.targetV;
    const targetCaAbs = options.targetCaAbsolute || profile.targetCaAbsolute;

    if (options.limeMethod === 'ca_ctc') {
      nc = positive(((ctc * (profile.targetCaCtc / 100) - ca) * 5600 / lime.cao) / prnt);
      formula = `NC = ((T × ${profile.targetCaCtc / 100} - Ca) × 5600 / ${lime.cao}% CaO) / ${prnt}% PRNT`;
    }
    if (options.limeMethod === 'v_percent') {
      nc = positive((ctc * (targetV - v1) / 100) * (100 / prnt));
      formula = `NC = (CTC pH7 × (V2 - V1) / 100) × (100 / PRNT)`;
    }
    if (options.limeMethod === 'ca_absoluto') {
      nc = positive(((targetCaAbs - ca) * 2) * (100 / prnt));
      formula = `NC = ((Ca2 - Ca1) × 2) × (100 / PRNT)`;
    }

    results.push({
      key: 'calagem',
      title: 'Recomendação de Calagem',
      dose: `${round(nc, 2)} t/ha de ${lime.label}`,
      source: lime.label,
      formula,
      details: [
        `CTC pH 7,0: ${round(ctc, 2)} cmolc/dm³`,
        `Ca atual: ${round(ca, 2)} cmolc/dm³`,
        `V% atual: ${round(v1, 1)}% | V% alvo: ${targetV}%`,
        `PRNT utilizado: ${prnt}%`
      ],
      warning: nc === 0 ? 'O cálculo não indicou necessidade de calcário pelo método selecionado.' : undefined
    });
  }

  if (options.selectedRecommendations.includes('gessagem')) {
    const ctcE = getCmol(analysis, 'sb') ?? ((getCmol(analysis, 'ca') ?? 0) + (getCmol(analysis, 'mg') ?? 0) + (getCmol(analysis, 'k') ?? 0) + (getCmol(analysis, 'al') ?? 0));
    const ng = positive((0.6 * ctcE - ca) * 6.4);
    results.push({
      key: 'gessagem',
      title: 'Recomendação de Gessagem',
      dose: `${round(ng, 2)} t/ha de gesso agrícola`,
      formula: 'NG = (0,6 × CTCe - Ca) × 6,4',
      details: [`CTCe estimada: ${round(ctcE, 2)} cmolc/dm³`, `Ca atual: ${round(ca, 2)} cmolc/dm³`, 'Alvo: 60% de Ca na CTC efetiva.'],
      warning: ng === 0 ? 'O cálculo não indicou necessidade de gesso pelo método selecionado.' : undefined
    });
  }

  if (options.selectedRecommendations.includes('fosforo')) {
    const klass = nutrientClass(analysis, 'p');
    const p2o5 = profile.p2o5[klass];
    results.push({
      key: 'fosforo',
      title: 'Recomendação de Fósforo',
      dose: `${p2o5} kg/ha de P₂O₅`,
      details: [
        `Classe de P: ${klass === 'low' ? 'Baixo' : klass === 'medium' ? 'Médio' : 'Alto'}`,
        `Superfosfato simples, 18% P₂O₅: ${round(p2o5 / 0.18, 0)} kg/ha`,
        `Superfosfato triplo, 41% P₂O₅: ${round(p2o5 / 0.41, 0)} kg/ha`
      ]
    });
  }

  if (options.selectedRecommendations.includes('potassio')) {
    const klass = nutrientClass(analysis, 'k');
    const k2o = profile.k2o[klass];
    results.push({
      key: 'potassio',
      title: 'Recomendação de Potássio',
      dose: `${k2o} kg/ha de K₂O`,
      details: [
        `Classe de K: ${klass === 'low' ? 'Baixo' : klass === 'medium' ? 'Médio' : 'Alto'}`,
        `Cloreto de potássio, 58% K₂O: ${round(k2o / 0.58, 0)} kg/ha`
      ]
    });
  }

  if (options.selectedRecommendations.includes('micros')) {
    const lowMicros = ['b', 'cu', 'mn', 'zn'].filter((key) => nutrientClass(analysis, key) === 'low').map((k) => k.toUpperCase());
    results.push({
      key: 'micros',
      title: 'Recomendação de Micronutrientes',
      dose: lowMicros.length ? `${profile.micros.doseKgHa} kg/ha de ${profile.micros.product}` : 'Sem recomendação automática',
      details: [
        lowMicros.length ? `Micronutrientes baixos: ${lowMicros.join(', ')}` : 'Nenhum micronutriente baixo foi identificado entre B, Cu, Mn e Zn.',
        profile.micros.note
      ]
    });
  }

  if (options.selectedRecommendations.includes('camaFrango')) {
    const nEffectivePerTon = (options.poultryNPercent / 100) * 1000 * (options.poultryEfficiency / 100);
    const dose = profile.nDemandKgHa > 0 && nEffectivePerTon > 0 ? profile.nDemandKgHa / nEffectivePerTon : 0;
    results.push({
      key: 'camaFrango',
      title: 'Recomendação de Cama de Frango',
      dose: dose > 0 ? `${round(dose, 2)} t/ha de cama de frango` : 'Não recomendado automaticamente para esta cultura',
      formula: 'Dose = N requerido / (N total da cama × eficiência no primeiro cultivo)',
      details: [
        `N requerido pela cultura: ${profile.nDemandKgHa} kg/ha`,
        `N médio da cama: ${options.poultryNPercent}%`,
        `Eficiência considerada no primeiro cultivo: ${options.poultryEfficiency}%`,
        `N efetivo estimado: ${round(nEffectivePerTon, 1)} kg/t`
      ],
      warning: profile.key === 'soja' ? 'Para soja, a recomendação por N deve ser evitada devido à fixação biológica. Avalie principalmente P, K, salinidade e legislação local.' : undefined
    });
  }

  return results;
}
