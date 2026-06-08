import { InterpretationItem, RecommendationResult, RecommendationKey } from './types';

export function StatusBadge({ status }: { status: string }) {
  const cls = status === 'Baixo' || status === 'Crítico' ? 'danger' : status === 'Médio' ? 'warning' : 'success';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function GradientBar({ item }: { item: InterpretationItem }) {
  return (
    <div className="gradient-wrap">
      <div className="gradient-labels"><span>Baixo ({item.lowMax})</span><span>Médio ({item.mediumMax})</span><span>Alto ({item.max})</span></div>
      <div className="gradient-bar">
        <span className="marker" style={{ left: `${item.percent}%` }} title={`Valor: ${item.value}`} />
      </div>
    </div>
  );
}

export function InterpretationTable({ items }: { items: InterpretationItem[] }) {
  if (!items.length) return <div className="empty">Nenhum atributo reconhecido para interpretação.</div>;
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr><th>Nutriente</th><th>U.M.</th><th>Valor</th><th>Classificação</th><th>Análise visual</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.key}-${item.nutrient}`}>
              <td>{item.nutrient}</td>
              <td>{item.unit}</td>
              <td>{item.value}</td>
              <td><StatusBadge status={item.status} /></td>
              <td><GradientBar item={item} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const recommendationLabels: Record<RecommendationKey, string> = {
  calagem: 'Calagem',
  gessagem: 'Gessagem',
  camaFrango: 'Cama de Frango',
  fosforo: 'Fósforo',
  potassio: 'Potássio',
  micros: 'Micro Nutrientes'
};

export function RecommendationCards({ results }: { results: RecommendationResult[] }) {
  if (!results.length) return <div className="empty">Selecione ao menos um módulo de recomendação.</div>;
  return (
    <div className="cards-grid">
      {results.map((result) => (
        <article className="rec-card" key={result.key}>
          <h3>{result.title}</h3>
          <p className="dose">{result.dose}</p>
          {result.formula && <p className="formula">{result.formula}</p>}
          <ul>{result.details.map((d) => <li key={d}>{d}</li>)}</ul>
          {result.warning && <div className="warning-box">{result.warning}</div>}
        </article>
      ))}
    </div>
  );
}
