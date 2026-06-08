import { useMemo, useState } from 'react';
import { parseSoilFile } from './parser';
import { CULTURES, PROFILE_BY_KEY } from './profiles';
import { calculateRecommendations, interpretSoil } from './calculators';
import { exportReportToPdf } from './pdf';
import { CultureKey, RecommendationKey, LimeMethod, LimeSource, SoilAnalysis } from './types';
import { InterpretationTable, RecommendationCards, recommendationLabels } from './components';

const RECOMMENDATIONS: RecommendationKey[] = ['calagem', 'gessagem', 'camaFrango', 'fosforo', 'potassio', 'micros'];

export default function App() {
  const [analysis, setAnalysis] = useState<SoilAnalysis | null>(null);
  const [error, setError] = useState('');
  const [culture, setCulture] = useState<CultureKey>('mandioca');
  const [selectedRecommendations, setSelectedRecommendations] = useState<RecommendationKey[]>(['calagem', 'fosforo', 'potassio']);
  const [limeMethod, setLimeMethod] = useState<LimeMethod>('v_percent');
  const [limeSource, setLimeSource] = useState<LimeSource>('dolomitico');
  const [prnt, setPrnt] = useState(85);
  const [targetV, setTargetV] = useState(60);
  const [targetCaAbsolute, setTargetCaAbsolute] = useState(2.0);
  const [poultryNPercent, setPoultryNPercent] = useState(3.0);
  const [poultryEfficiency, setPoultryEfficiency] = useState(50);
  const [isExporting, setIsExporting] = useState(false);

  const profile = PROFILE_BY_KEY[culture];

  function onCultureChange(value: CultureKey) {
    const next = PROFILE_BY_KEY[value];
    setCulture(value);
    setTargetV(next.targetV);
    setTargetCaAbsolute(next.targetCaAbsolute);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError('');
    try {
      const parsed = await parseSoilFile(file);
      setAnalysis(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler a planilha.');
    }
  }

  function toggleRecommendation(key: RecommendationKey) {
    setSelectedRecommendations((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  const interpretation = useMemo(() => analysis ? interpretSoil(analysis) : [], [analysis]);
  const recommendations = useMemo(() => {
    if (!analysis) return [];
    return calculateRecommendations(analysis, profile, {
      selectedRecommendations,
      limeMethod,
      limeSource,
      prnt,
      targetV,
      targetCaAbsolute,
      poultryNPercent,
      poultryEfficiency
    });
  }, [analysis, profile, selectedRecommendations, limeMethod, limeSource, prnt, targetV, targetCaAbsolute, poultryNPercent, poultryEfficiency]);

  async function handlePdf() {
    setIsExporting(true);
    try {
      await exportReportToPdf('report-area', `laudo-solo-${profile.name.toLowerCase().replaceAll(' ', '-')}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <span className="eyebrow">AgroInData</span>
          <h1>Sistema online de recomendação de correção de solo</h1>
          <p>Faça upload da análise, selecione a cultura, gere a interpretação visual e exporte o laudo técnico em PDF.</p>
        </div>
        <div className="hero-card">
          <strong>Modelo aceito</strong>
          <span>Excel, XLSX, XLS ou ODS com colunas: Nutriente, U.M. e Valor.</span>
        </div>
      </header>

      <section className="panel">
        <h2>1. Upload da análise</h2>
        <label className="upload-box">
          <input type="file" accept=".xlsx,.xls,.ods,.csv" onChange={(e) => handleFile(e.target.files?.[0])} />
          <span>{analysis?.fileName || 'Clique para carregar a planilha de análise de solo'}</span>
        </label>
        {error && <div className="error-box">{error}</div>}
      </section>

      <section className="panel controls">
        <h2>2. Seleção da cultura e módulos</h2>
        <div className="form-grid">
          <label>
            Cultura
            <select value={culture} onChange={(e) => onCultureChange(e.target.value as CultureKey)}>
              {CULTURES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </label>
          <label>
            Método de calagem
            <select value={limeMethod} onChange={(e) => setLimeMethod(e.target.value as LimeMethod)}>
              <option value="ca_ctc">Ca na CTC</option>
              <option value="v_percent">Saturação por Bases (V%)</option>
              <option value="ca_absoluto">Ca Absoluto</option>
            </select>
          </label>
          <label>
            Fonte de calcário
            <select value={limeSource} onChange={(e) => setLimeSource(e.target.value as LimeSource)}>
              <option value="magnesiano">Magnesiano</option>
              <option value="dolomitico">Dolomítico</option>
              <option value="calcitico">Calcítico</option>
            </select>
          </label>
          <label>PRNT (%)<input type="number" value={prnt} onChange={(e) => setPrnt(Number(e.target.value))} /></label>
          <label>V% desejado<input type="number" value={targetV} onChange={(e) => setTargetV(Number(e.target.value))} /></label>
          <label>Ca alvo (cmolc/dm³)<input type="number" step="0.1" value={targetCaAbsolute} onChange={(e) => setTargetCaAbsolute(Number(e.target.value))} /></label>
          <label>N na cama de frango (%)<input type="number" step="0.1" value={poultryNPercent} onChange={(e) => setPoultryNPercent(Number(e.target.value))} /></label>
          <label>Eficiência do N (%)<input type="number" value={poultryEfficiency} onChange={(e) => setPoultryEfficiency(Number(e.target.value))} /></label>
        </div>
        <div className="toggle-row">
          {RECOMMENDATIONS.map((key) => (
            <button key={key} className={selectedRecommendations.includes(key) ? 'toggle active' : 'toggle'} onClick={() => toggleRecommendation(key)}>
              {recommendationLabels[key]}
            </button>
          ))}
        </div>
      </section>

      <section id="report-area" className="report">
        <div className="report-header">
          <div>
            <span className="eyebrow">Laudo técnico</span>
            <h2>Interpretação da análise e recomendação final</h2>
            <p>Cultura selecionada: <strong>{profile.name}</strong></p>
          </div>
          <div className="meta">
            <span>Arquivo: {analysis?.fileName || 'não carregado'}</span>
            <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <section className="panel white">
          <h2>3. Releitura da análise de solo</h2>
          {analysis ? <InterpretationTable items={interpretation} /> : <div className="empty">Carregue uma análise para visualizar a classificação.</div>}
        </section>

        <section className="panel white">
          <h2>4. Recomendação final</h2>
          <RecommendationCards results={recommendations} />
        </section>

        <section className="panel white">
          <h2>Observações técnicas</h2>
          <ul className="notes">
            {profile.notes.map((note) => <li key={note}>{note}</li>)}
            <li>Quando a análise não traz argila, silte e areia, o sistema mantém a recomendação sem usar textura.</li>
            <li>Valide os parâmetros com um responsável técnico antes de uso comercial.</li>
          </ul>
        </section>
      </section>

      <div className="action-bar">
        <button className="primary" disabled={!analysis || isExporting} onClick={handlePdf}>{isExporting ? 'Gerando PDF...' : 'Gerar laudo em PDF'}</button>
      </div>
    </main>
  );
}
