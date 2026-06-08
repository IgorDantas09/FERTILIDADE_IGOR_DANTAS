import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileSpreadsheet, FileText } from "lucide-react";

type Cultura =
  | "Mandioca"
  | "Pastagem para leite"
  | "Pastagem para Gado de corte"
  | "Milho"
  | "Soja"
  | "Cana";

type MetodoCalagem = "V%" | "Ca na CTC" | "Ca Absoluto";
type TipoCalcario = "dolomítico" | "magnesiano" | "calcítico";

type AnaliseSolo = {
  ca: number;
  mg: number;
  k: number;
  p: number;
  s: number;
  b: number;
  zn: number;
  cu: number;
  mn: number;
  fe: number;
  ph: number;
  mo: number;
  ctc: number;
  ctce: number;
  v: number;
  argila?: number;
  silte?: number;
  areia?: number;
};

const culturas: Cultura[] = [
  "Mandioca",
  "Pastagem para leite",
  "Pastagem para Gado de corte",
  "Milho",
  "Soja",
  "Cana",
];

const parametrosCultura: Record<
  Cultura,
  {
    v2: number;
    caIdeal: number;
    p2o5: number;
    k2o: number;
    n: number;
    caCtcAlvo: number;
  }
> = {
  Mandioca: {
    v2: 50,
    caIdeal: 2,
    p2o5: 70,
    k2o: 70,
    n: 60,
    caCtcAlvo: 0.6,
  },
  "Pastagem para leite": {
    v2: 60,
    caIdeal: 2.5,
    p2o5: 80,
    k2o: 80,
    n: 120,
    caCtcAlvo: 0.6,
  },
  "Pastagem para Gado de corte": {
    v2: 50,
    caIdeal: 2,
    p2o5: 60,
    k2o: 60,
    n: 80,
    caCtcAlvo: 0.6,
  },
  Milho: {
    v2: 70,
    caIdeal: 3,
    p2o5: 90,
    k2o: 90,
    n: 120,
    caCtcAlvo: 0.6,
  },
  Soja: {
    v2: 60,
    caIdeal: 2.5,
    p2o5: 80,
    k2o: 80,
    n: 0,
    caCtcAlvo: 0.6,
  },
  Cana: {
    v2: 60,
    caIdeal: 3,
    p2o5: 100,
    k2o: 120,
    n: 100,
    caCtcAlvo: 0.6,
  },
};

const caOCalcario: Record<TipoCalcario, number> = {
  dolomítico: 30,
  magnesiano: 35,
  calcítico: 45,
};

function normalizarTexto(texto: string) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function numero(valor: any): number {
  if (valor === undefined || valor === null || valor === "") return 0;
  if (typeof valor === "number") return valor;
  return Number(String(valor).replace(",", ".")) || 0;
}

function getValor(row: any, nomes: string[]) {
  const chaves = Object.keys(row);

  for (const nome of nomes) {
    const alvo = normalizarTexto(nome);
    const encontrada = chaves.find((c) => normalizarTexto(c).includes(alvo));
    if (encontrada) return numero(row[encontrada]);
  }

  return 0;
}

function classificar(valor: number, baixo: number, alto: number) {
  if (valor < baixo) return "Baixo";
  if (valor < alto) return "Médio";
  return "Alto";
}

function corClasse(classe: string) {
  if (classe === "Baixo") return "#dc2626";
  if (classe === "Médio") return "#ca8a04";
  return "#16a34a";
}

function App() {
  const [analise, setAnalise] = useState<AnaliseSolo | null>(null);
  const [cultura, setCultura] = useState<Cultura>("Mandioca");
  const [metodoCalagem, setMetodoCalagem] = useState<MetodoCalagem>("V%");
  const [tipoCalcario, setTipoCalcario] = useState<TipoCalcario>("dolomítico");
  const [prnt, setPrnt] = useState<number>(85);

  const [usarCalagem, setUsarCalagem] = useState(true);
  const [usarGessagem, setUsarGessagem] = useState(true);
  const [usarCamaFrango, setUsarCamaFrango] = useState(true);
  const [usarFosforo, setUsarFosforo] = useState(true);
  const [usarPotassio, setUsarPotassio] = useState(true);
  const [usarMicros, setUsarMicros] = useState(true);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      alert("A planilha não possui dados válidos.");
      return;
    }

    const row = rows[0];

    const novaAnalise: AnaliseSolo = {
      ca: getValor(row, ["Ca", "Calcio", "Cálcio"]),
      mg: getValor(row, ["Mg", "Magnesio", "Magnésio"]),
      k: getValor(row, ["K", "Potassio", "Potássio"]),
      p: getValor(row, ["P", "Fosforo", "Fósforo"]),
      s: getValor(row, ["S", "Enxofre"]),
      b: getValor(row, ["B", "Boro"]),
      zn: getValor(row, ["Zn", "Zinco"]),
      cu: getValor(row, ["Cu", "Cobre"]),
      mn: getValor(row, ["Mn", "Manganes"]),
      fe: getValor(row, ["Fe", "Ferro"]),
      ph: getValor(row, ["pH"]),
      mo: getValor(row, ["MO", "Materia Organica"]),
      ctc: getValor(row, ["CTC", "T"]),
      ctce: getValor(row, ["CTCe", "CTC efetiva"]),
      v: getValor(row, ["V%", "Saturacao por bases", "Saturação por bases"]),
      argila: getValor(row, ["Argila"]),
      silte: getValor(row, ["Silte"]),
      areia: getValor(row, ["Areia"]),
    };

    if (!novaAnalise.ctce) {
      novaAnalise.ctce = novaAnalise.ca + novaAnalise.mg + novaAnalise.k / 391;
    }

    setAnalise(novaAnalise);
  };

  const interpretacoes = useMemo(() => {
    if (!analise) return [];

    return [
      {
        nutriente: "pH",
        unidade: "CaCl₂/H₂O",
        valor: analise.ph,
        baixo: 5.2,
        alto: 6.2,
      },
      {
        nutriente: "Ca",
        unidade: "cmolc/dm³",
        valor: analise.ca,
        baixo: 1.5,
        alto: 3,
      },
      {
        nutriente: "Mg",
        unidade: "cmolc/dm³",
        valor: analise.mg,
        baixo: 0.5,
        alto: 1.2,
      },
      {
        nutriente: "K",
        unidade: "mg/dm³",
        valor: analise.k,
        baixo: 50,
        alto: 120,
      },
      {
        nutriente: "P",
        unidade: "mg/dm³",
        valor: analise.p,
        baixo: 8,
        alto: 20,
      },
      {
        nutriente: "S",
        unidade: "mg/dm³",
        valor: analise.s,
        baixo: 5,
        alto: 10,
      },
      {
        nutriente: "B",
        unidade: "mg/dm³",
        valor: analise.b,
        baixo: 0.2,
        alto: 0.6,
      },
      {
        nutriente: "Zn",
        unidade: "mg/dm³",
        valor: analise.zn,
        baixo: 0.6,
        alto: 1.2,
      },
      {
        nutriente: "Cu",
        unidade: "mg/dm³",
        valor: analise.cu,
        baixo: 0.3,
        alto: 0.8,
      },
      {
        nutriente: "Mn",
        unidade: "mg/dm³",
        valor: analise.mn,
        baixo: 2,
        alto: 5,
      },
      {
        nutriente: "MO",
        unidade: "%",
        valor: analise.mo,
        baixo: 2,
        alto: 4,
      },
      {
        nutriente: "V%",
        unidade: "%",
        valor: analise.v,
        baixo: 45,
        alto: parametrosCultura[cultura].v2,
      },
    ].map((i) => ({
      ...i,
      classe: classificar(i.valor, i.baixo, i.alto),
    }));
  }, [analise, cultura]);

  const resultados = useMemo(() => {
    if (!analise) return null;

    const p = parametrosCultura[cultura];
    const prntDecimal = prnt || 85;

    let doseCalagem = 0;
    let formulaCalagem = "";

    if (metodoCalagem === "V%") {
      doseCalagem =
        analise.ctc * ((p.v2 - analise.v) / 100) * (100 / prntDecimal);
      formulaCalagem = "NC = CTC pH7 × ((V2 - V1) / 100) × (100 / PRNT)";
    }

    if (metodoCalagem === "Ca na CTC") {
      const cao = caOCalcario[tipoCalcario];
      doseCalagem =
        ((analise.ctc * p.caCtcAlvo - analise.ca) * 5600) / cao / prntDecimal;
      formulaCalagem = "NC = ((T × 0,6 - Ca) × 5600 / %CaO) / PRNT";
    }

    if (metodoCalagem === "Ca Absoluto") {
      doseCalagem = (p.caIdeal - analise.ca) * 2 * (100 / prntDecimal);
      formulaCalagem = "NC = ((Ca2 - Ca1) × 2) × (100 / PRNT)";
    }

    if (doseCalagem < 0) doseCalagem = 0;

    let doseGesso = (0.6 * analise.ctce - analise.ca) * 6.4;
    if (doseGesso < 0) doseGesso = 0;

    const doseP2O5 = analise.p < 8 ? p.p2o5 : analise.p < 20 ? p.p2o5 * 0.6 : 0;
    const doseK2O = analise.k < 50 ? p.k2o : analise.k < 120 ? p.k2o * 0.6 : 0;

    const sfs = doseP2O5 / 0.18;
    const sft = doseP2O5 / 0.41;
    const kcl = doseK2O / 0.58;

    const nCama = 3;
    const eficiencia = 60;
    const nEfetivoKgPorT = 1000 * (nCama / 100) * (eficiencia / 100);
    const doseCama = p.n > 0 ? p.n / nEfetivoKgPorT : 0;

    const micros = interpretacoes
      .filter((i) => ["B", "Zn", "Cu", "Mn"].includes(i.nutriente))
      .filter((i) => i.classe === "Baixo")
      .map((i) => ({
        nutriente: i.nutriente,
        recomendacao:
          i.nutriente === "B"
            ? "Aplicar fonte de boro conforme recomendação técnica."
            : i.nutriente === "Zn"
            ? "Aplicar fonte de zinco conforme recomendação técnica."
            : i.nutriente === "Cu"
            ? "Aplicar fonte de cobre conforme recomendação técnica."
            : "Aplicar fonte de manganês conforme recomendação técnica.",
      }));

    return {
      doseCalagem,
      formulaCalagem,
      doseGesso,
      doseP2O5,
      doseK2O,
      sfs,
      sft,
      kcl,
      doseCama,
      nCama,
      eficiencia,
      nEfetivoKgPorT,
      micros,
    };
  }, [analise, cultura, metodoCalagem, tipoCalcario, prnt, interpretacoes]);

  const gerarPDF = () => {
    if (!analise || !resultados) return;

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const addTitle = (title: string) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(20, 20, 20);
      pdf.text(title, margin, y);
      y += 8;
    };

    const addText = (text: string, fontSize = 10) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(70, 70, 70);
      const lines = pdf.splitTextToSize(text, contentWidth);
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 3;
    };

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        pdf.addPage();
        y = 18;
      }
    };

    const addCard = (
      title: string,
      mainValue: string,
      details: string[],
      formula?: string
    ) => {
      const cardHeight = 36 + details.length * 5 + (formula ? 10 : 0);
      checkPageBreak(cardHeight);

      pdf.setDrawColor(220, 230, 220);
      pdf.setFillColor(250, 253, 250);
      pdf.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, "FD");

      let cardY = y + 8;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(35, 45, 35);
      pdf.text(title, margin + 5, cardY);

      cardY += 8;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(20, 90, 45);
      pdf.text(mainValue, margin + 5, cardY);

      cardY += 9;

      if (formula) {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 80);
        pdf.setFillColor(238, 246, 238);
        pdf.roundedRect(margin + 5, cardY - 5, contentWidth - 10, 8, 2, 2, "F");
        pdf.text(formula, margin + 8, cardY);
        cardY += 10;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(70, 70, 70);

      details.forEach((item) => {
        const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 15);
        pdf.text(lines, margin + 8, cardY);
        cardY += lines.length * 5;
      });

      y += cardHeight + 6;
    };

    pdf.setFillColor(18, 90, 45);
    pdf.rect(0, 0, pageWidth, 24, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Laudo de Recomendação de Correção do Solo", margin, 15);

    y = 34;

    addTitle("1. Identificação da análise");
    addText(`Cultura selecionada: ${cultura}`);
    addText(`Método de calagem: ${metodoCalagem}`);
    addText(`Fonte de calcário: ${tipoCalcario}`);
    addText(`PRNT utilizado: ${prnt || 85}%`);

    addTitle("2. Interpretação da fertilidade");

    autoTable(pdf, {
      startY: y,
      head: [["Nutriente", "Unidade", "Valor", "Classificação"]],
      body: interpretacoes.map((item) => [
        item.nutriente,
        item.unidade,
        String(item.valor),
        item.classe,
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [18, 90, 45],
        textColor: [255, 255, 255],
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 3) {
          const value = String(data.cell.raw).toLowerCase();

          if (value.includes("baixo")) {
            data.cell.styles.textColor = [180, 30, 30];
            data.cell.styles.fontStyle = "bold";
          }

          if (value.includes("médio") || value.includes("medio")) {
            data.cell.styles.textColor = [190, 130, 20];
            data.cell.styles.fontStyle = "bold";
          }

          if (value.includes("alto")) {
            data.cell.styles.textColor = [20, 120, 60];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    addTitle("3. Observações da análise");
    addText(
      "A interpretação dos nutrientes foi realizada com base nos parâmetros técnicos configurados no sistema para a cultura selecionada."
    );

    pdf.addPage();
    y = 18;

    addTitle("4. Recomendação final");

    if (usarCalagem) {
      addCard(
        "Recomendação de Calagem",
        `${resultados.doseCalagem.toFixed(2)} t/ha de calcário ${tipoCalcario}`,
        [
          `CTC pH 7,0: ${analise.ctc} cmolc/dm³`,
          `Ca atual: ${analise.ca} cmolc/dm³`,
          `V% atual: ${analise.v}%`,
          `PRNT utilizado: ${prnt || 85}%`,
        ],
        resultados.formulaCalagem
      );
    }

    if (usarGessagem) {
      addCard(
        "Recomendação de Gessagem",
        `${resultados.doseGesso.toFixed(2)} t/ha de gesso agrícola`,
        [
          `CTC efetiva: ${analise.ctce} cmolc/dm³`,
          `Ca atual: ${analise.ca} cmolc/dm³`,
          "Cálculo baseado no equilíbrio de cálcio na CTC efetiva.",
        ],
        "NG = (0,6 × CTCe - Ca) × 6,4"
      );
    }

    if (usarFosforo) {
      addCard(
        "Recomendação de Fósforo",
        `${resultados.doseP2O5.toFixed(0)} kg/ha de P₂O₅`,
        [
          `Superfosfato simples, 18% P₂O₅: ${resultados.sfs.toFixed(0)} kg/ha`,
          `Superfosfato triplo, 41% P₂O₅: ${resultados.sft.toFixed(0)} kg/ha`,
        ]
      );
    }

    if (usarPotassio) {
      addCard(
        "Recomendação de Potássio",
        `${resultados.doseK2O.toFixed(0)} kg/ha de K₂O`,
        [`Cloreto de potássio, 58% K₂O: ${resultados.kcl.toFixed(0)} kg/ha`]
      );
    }

    if (usarMicros) {
      addCard(
        "Recomendação de Micronutrientes",
        resultados.micros.length
          ? "Correção conforme deficiência"
          : "Sem deficiência crítica identificada",
        resultados.micros.length
          ? resultados.micros.map((m) => `${m.nutriente}: ${m.recomendacao}`)
          : ["Não foram identificados micronutrientes classificados como baixos."]
      );
    }

    if (usarCamaFrango) {
      addCard(
        "Recomendação de Cama de Frango",
        `${resultados.doseCama.toFixed(2)} t/ha de cama de frango`,
        [
          `N requerido pela cultura: ${parametrosCultura[cultura].n} kg/ha`,
          `N médio da cama: ${resultados.nCama}%`,
          `Eficiência considerada: ${resultados.eficiencia}%`,
          `N efetivo estimado: ${resultados.nEfetivoKgPorT.toFixed(0)} kg/t`,
        ],
        "Dose = N requerido / (N total da cama × eficiência)"
      );
    }

    checkPageBreak(35);

    addTitle("5. Observações técnicas");
    addText(
      "Este laudo deve ser utilizado como apoio técnico à tomada de decisão. Recomenda-se validar as doses com um responsável técnico, considerando histórico da área, produtividade esperada, textura do solo, sistema de manejo e disponibilidade dos corretivos e fertilizantes."
    );

    addText(
      "Quando a análise não apresentar argila, silte ou areia, o sistema mantém a recomendação sem utilizar textura como fator de ajuste."
    );

    const totalPages = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 28, pageHeight - 8);
      pdf.text("AgroInData - Recomendação de Fertilidade", margin, pageHeight - 8);
    }

    pdf.save("laudo-recomendacao-solo.pdf");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl bg-green-800 p-6 text-white shadow">
          <h1 className="text-3xl font-bold">Sistema de Recomendação de Correção do Solo</h1>
          <p className="mt-2 text-green-100">
            Upload da análise, interpretação da fertilidade e geração de laudo em PDF.
          </p>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">1. Upload da análise de solo</h2>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-green-700 p-5">
            <FileSpreadsheet />
            <div>
              <strong>Selecionar arquivo Excel ou ODS</strong>
              <p className="text-sm text-slate-500">O sistema irá ler a primeira linha da primeira aba.</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.ods,.csv"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">2. Seleção da cultura e recomendações</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-semibold">Cultura</label>
              <select
                value={cultura}
                onChange={(e) => setCultura(e.target.value as Cultura)}
                className="mt-1 w-full rounded-lg border p-2"
              >
                {culturas.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Método de calagem</label>
              <select
                value={metodoCalagem}
                onChange={(e) => setMetodoCalagem(e.target.value as MetodoCalagem)}
                className="mt-1 w-full rounded-lg border p-2"
              >
                <option>V%</option>
                <option>Ca na CTC</option>
                <option>Ca Absoluto</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Tipo de calcário</label>
              <select
                value={tipoCalcario}
                onChange={(e) => setTipoCalcario(e.target.value as TipoCalcario)}
                className="mt-1 w-full rounded-lg border p-2"
              >
                <option value="dolomítico">Dolomítico</option>
                <option value="magnesiano">Magnesiano</option>
                <option value="calcítico">Calcítico</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">PRNT (%)</label>
              <input
                type="number"
                value={prnt}
                onChange={(e) => setPrnt(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["Calagem", usarCalagem, setUsarCalagem],
              ["Gessagem", usarGessagem, setUsarGessagem],
              ["Cama de Frango", usarCamaFrango, setUsarCamaFrango],
              ["Fósforo", usarFosforo, setUsarFosforo],
              ["Potássio", usarPotassio, setUsarPotassio],
              ["Micronutrientes", usarMicros, setUsarMicros],
            ].map(([label, ativo, setAtivo]: any) => (
              <button
                key={label}
                onClick={() => setAtivo(!ativo)}
                className={`rounded-xl border p-3 font-semibold ${
                  ativo ? "border-green-700 bg-green-100 text-green-900" : "bg-white text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {analise && resultados && (
          <>
            <section className="mb-6 rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold">3. Interpretação da análise de solo</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-green-800 text-white">
                      <th className="p-3 text-left">Nutriente</th>
                      <th className="p-3 text-left">U.M</th>
                      <th className="p-3 text-left">Valor</th>
                      <th className="p-3 text-left">Classificação</th>
                      <th className="p-3 text-left">Análise visual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interpretacoes.map((item) => {
                      const posicao = Math.min(
                        100,
                        Math.max(0, (item.valor / item.alto) * 100)
                      );

                      return (
                        <tr key={item.nutriente} className="border-b">
                          <td className="p-3 font-semibold">{item.nutriente}</td>
                          <td className="p-3">{item.unidade}</td>
                          <td className="p-3">{item.valor}</td>
                          <td className="p-3 font-bold" style={{ color: corClasse(item.classe) }}>
                            {item.classe}
                          </td>
                          <td className="p-3">
                            <div className="relative h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-600">
                              <div
                                className="absolute -top-1 h-6 w-1 rounded bg-black"
                                style={{ left: `${posicao}%` }}
                              />
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-slate-500">
                              <span>Baixo</span>
                              <span>Médio</span>
                              <span>Alto</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold">4. Recomendação final</h2>

              <div className="grid gap-4 md:grid-cols-2">
                {usarCalagem && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Recomendação de Calagem</h3>
                    <p className="text-2xl font-bold text-green-800">
                      {resultados.doseCalagem.toFixed(2)} t/ha de calcário {tipoCalcario}
                    </p>
                  </div>
                )}

                {usarGessagem && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Recomendação de Gessagem</h3>
                    <p className="text-2xl font-bold text-green-800">
                      {resultados.doseGesso.toFixed(2)} t/ha de gesso agrícola
                    </p>
                  </div>
                )}

                {usarFosforo && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Recomendação de Fósforo</h3>
                    <p className="text-2xl font-bold text-green-800">
                      {resultados.doseP2O5.toFixed(0)} kg/ha de P₂O₅
                    </p>
                  </div>
                )}

                {usarPotassio && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Recomendação de Potássio</h3>
                    <p className="text-2xl font-bold text-green-800">
                      {resultados.doseK2O.toFixed(0)} kg/ha de K₂O
                    </p>
                  </div>
                )}

                {usarCamaFrango && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Recomendação de Cama de Frango</h3>
                    <p className="text-2xl font-bold text-green-800">
                      {resultados.doseCama.toFixed(2)} t/ha de cama de frango
                    </p>
                  </div>
                )}

                {usarMicros && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-bold">Micronutrientes</h3>
                    <p className="text-green-800">
                      {resultados.micros.length
                        ? "Correções identificadas para micronutrientes baixos."
                        : "Sem deficiência crítica identificada."}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={gerarPDF}
                className="mt-6 flex items-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-bold text-white hover:bg-green-900"
              >
                <FileText size={20} />
                Gerar laudo em PDF
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
