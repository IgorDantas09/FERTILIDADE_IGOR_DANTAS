const gerarPDF = () => {
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
    if (y + neededHeight > pageHeight - 15) {
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
    const cardHeight = 48 + details.length * 5 + (formula ? 10 : 0);

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

  // CAPA / CABEÇALHO
  pdf.setFillColor(18, 90, 45);
  pdf.rect(0, 0, pageWidth, 24, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Laudo de Recomendação de Correção do Solo", margin, 15);

  y = 34;

  addTitle("1. Identificação da análise");

  addText(`Cultura selecionada: ${culturaSelecionada || "Não informada"}`);
  addText(`Método de calagem: ${metodoCalagem || "Não informado"}`);
  addText(`Fonte de calcário: ${tipoCalcario || "Não informado"}`);
  addText(`PRNT utilizado: ${prnt || 85}%`);

  checkPageBreak(35);

  addTitle("2. Interpretação da fertilidade");

  autoTable(pdf, {
    startY: y,
    head: [["Nutriente", "Unidade", "Valor", "Classificação"]],
    body: interpretacoes.map((item: any) => [
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

  checkPageBreak(40);

  addTitle("3. Observações da análise");

  addText(
    "A interpretação dos nutrientes foi realizada com base nos parâmetros técnicos configurados no sistema para a cultura selecionada. Nutrientes classificados como baixos indicam maior probabilidade de resposta à adubação ou correção."
  );

  // FORÇA A RECOMENDAÇÃO FINAL COMEÇAR EM NOVA PÁGINA
  pdf.addPage();
  y = 18;

  addTitle("4. Recomendação final");

  if (resultadoCalagem) {
    addCard(
      "Recomendação de Calagem",
      `${resultadoCalagem.dose.toFixed(2)} t/ha de Calcário ${tipoCalcario}`,
      [
        `CTC pH 7,0: ${analiseSolo.ctc || 0} cmolc/dm³`,
        `Ca atual: ${analiseSolo.ca || 0} cmolc/dm³`,
        `V% atual: ${analiseSolo.v || 0}%`,
        `PRNT utilizado: ${prnt || 85}%`,
      ],
      resultadoCalagem.formula
    );
  }

  if (resultadoGessagem) {
    addCard(
      "Recomendação de Gessagem",
      `${resultadoGessagem.dose.toFixed(2)} t/ha de gesso agrícola`,
      [
        `CTC efetiva: ${analiseSolo.ctce || 0} cmolc/dm³`,
        `Ca atual: ${analiseSolo.ca || 0} cmolc/dm³`,
        "Cálculo baseado no equilíbrio de cálcio na CTC efetiva.",
      ],
      "NG = (0,6 × CTCe - Ca) × 6,4"
    );
  }

  if (resultadoFosforo) {
    addCard(
      "Recomendação de Fósforo",
      `${resultadoFosforo.p2o5} kg/ha de P₂O₅`,
      [
        `Classe de P: ${resultadoFosforo.classe}`,
        `Superfosfato simples, 18% P₂O₅: ${resultadoFosforo.sfs} kg/ha`,
        `Superfosfato triplo, 41% P₂O₅: ${resultadoFosforo.sft} kg/ha`,
      ]
    );
  }

  if (resultadoPotassio) {
    addCard(
      "Recomendação de Potássio",
      `${resultadoPotassio.k2o} kg/ha de K₂O`,
      [
        `Classe de K: ${resultadoPotassio.classe}`,
        `Cloreto de potássio, 58% K₂O: ${resultadoPotassio.kcl} kg/ha`,
      ]
    );
  }

  if (resultadoMicros) {
    addCard(
      "Recomendação de Micronutrientes",
      "Correção conforme deficiência identificada",
      resultadoMicros.map(
        (m: any) => `${m.nutriente}: ${m.recomendacao}`
      )
    );
  }

  if (resultadoCamaFrango) {
    addCard(
      "Recomendação de Cama de Frango",
      `${resultadoCamaFrango.dose.toFixed(2)} t/ha de cama de frango`,
      [
        `N requerido pela cultura: ${resultadoCamaFrango.nRequerido} kg/ha`,
        `N médio da cama: ${resultadoCamaFrango.nMedio}%`,
        `Eficiência considerada no primeiro cultivo: ${resultadoCamaFrango.eficiencia}%`,
        `N efetivo estimado: ${resultadoCamaFrango.nEfetivo} kg/t`,
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
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin - 25,
      pageHeight - 8
    );
    pdf.text("AgroInData - Recomendação de Fertilidade", margin, pageHeight - 8);
  }

  pdf.save("laudo-recomendacao-solo.pdf");
};
