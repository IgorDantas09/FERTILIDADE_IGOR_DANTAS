import * as XLSX from 'xlsx';
import { SoilAnalysis, SoilRow } from './types';

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+%]/g, '');

export const canonicalKey = (raw: string): string => {
  const n = normalizeText(raw);
  if (n === 'ph' || n.includes('ph')) return 'ph';
  if (n.includes('mo') || n.includes('materiaorganica')) return 'mo';
  if (n === 'pr' || n === 'p' || n.startsWith('pmeh') || n.startsWith('presina')) return 'p';
  if (n === 's' || n.includes('enxofre')) return 's';
  if (n === 'al' || n.includes('aluminio')) return 'al';
  if (n.includes('h+al') || n.includes('hal')) return 'h_al';
  if (n === 'k' || n.includes('potassio')) return 'k';
  if (n === 'ca' || n.includes('calcio')) return 'ca';
  if (n === 'mg' || n.includes('magnesio')) return 'mg';
  if (n === 'sb' || n.includes('somadebases')) return 'sb';
  if (n === 'ctc' || n.includes('ctcph7') || n.includes('t')) return 'ctc';
  if (n === 'v' || n === 'v%' || n.includes('saturacaoporbases')) return 'v';
  if (n === 'm' || n === 'm%' || n.includes('saturacaoporal')) return 'm';
  if (n === 'b' || n.includes('boro')) return 'b';
  if (n === 'cu' || n.includes('cobre')) return 'cu';
  if (n === 'fe' || n.includes('ferro')) return 'fe';
  if (n === 'mn' || n.includes('manganes')) return 'mn';
  if (n === 'zn' || n.includes('zinco')) return 'zn';
  if (n.includes('argila')) return 'argila';
  if (n.includes('silte')) return 'silte';
  if (n.includes('areia')) return 'areia';
  return n;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

function findColumn(headers: string[], candidates: string[]) {
  const normalized = headers.map((h) => normalizeText(h));
  for (const candidate of candidates.map(normalizeText)) {
    const index = normalized.findIndex((h) => h === candidate || h.includes(candidate));
    if (index >= 0) return headers[index];
  }
  return undefined;
}

export async function parseSoilFile(file: File): Promise<SoilAnalysis> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (!json.length) throw new Error('A planilha está vazia ou não foi reconhecida.');

  const headers = Object.keys(json[0]);
  const nutrientCol = findColumn(headers, ['nutriente', 'atributo', 'elemento', 'parametro']);
  const unitCol = findColumn(headers, ['u.m', 'um', 'unidade', 'unid']);
  const valueCol = findColumn(headers, ['valor', 'resultado', 'teor']);

  if (!nutrientCol || !valueCol) {
    throw new Error('Não encontrei as colunas Nutriente e Valor. Use o modelo: Nutriente | U.M | Valor.');
  }

  const rows: SoilRow[] = [];
  const values: Record<string, number> = {};
  const units: Record<string, string> = {};

  for (const item of json) {
    const nutrient = String(item[nutrientCol] ?? '').trim();
    const value = toNumber(item[valueCol]);
    if (!nutrient || value === null) continue;
    const key = canonicalKey(nutrient);
    const unit = String(unitCol ? item[unitCol] : '').trim();
    rows.push({ nutrient: key, originalName: nutrient, unit, value });
    values[key] = value;
    units[key] = unit;
  }

  if (!rows.length) throw new Error('Não encontrei valores numéricos de análise de solo.');
  return { rows, values, units, fileName: file.name };
}

export function cmolFromMmol(value?: number) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return value / 10;
}

export function getCmol(analysis: SoilAnalysis, key: string) {
  const value = analysis.values[key];
  if (value === undefined) return undefined;
  const unit = (analysis.units[key] || '').toLowerCase();
  if (unit.includes('mmol')) return value / 10;
  return value;
}

export function getValue(analysis: SoilAnalysis, key: string) {
  return analysis.values[key];
}
