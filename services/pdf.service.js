const pdfmake = require("pdfmake");

// Polices standard PDF (Helvetica) : pas de fichier .ttf à embarquer, et leur
// encodage WinAnsi couvre les caractères accentués français (é, è, à, ç...).
pdfmake.setFonts({
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});
// Aucune image chargée par URL distante dans nos rapports (uniquement du texte/tableaux).
pdfmake.setUrlAccessPolicy(() => false);

const GOLD = "#b8860b";
const MUTED = "#6b7280";
const DARK = "#1f2937";

const styles = {
  brand: { fontSize: 9, bold: true, color: GOLD, characterSpacing: 1, margin: [0, 0, 0, 4] },
  title: { fontSize: 20, bold: true, color: DARK, margin: [0, 0, 0, 2] },
  subtitle: { fontSize: 10, color: MUTED },
  sectionHeading: { fontSize: 13, bold: true, color: DARK, margin: [0, 16, 0, 4] },
  sectionMeta: { fontSize: 9, color: MUTED, margin: [0, 0, 0, 6] },
  tableHeader: { fontSize: 9, bold: true, color: "#ffffff", fillColor: DARK },
  tableCell: { fontSize: 9, color: DARK },
  footerText: { fontSize: 8, color: MUTED },
  emptyNote: { fontSize: 9, italics: true, color: MUTED, margin: [0, 0, 0, 8] },
};

function tableLayoutLight() {
  return {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
    vLineWidth: () => 0,
    hLineColor: () => "#e5e7eb",
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  };
}

function reportHeader(title, subtitle) {
  return [
    { text: "JM · JOELSON & MARJORIE", style: "brand" },
    { text: title, style: "title" },
    { text: subtitle, style: "subtitle" },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#d1d5db" }],
      margin: [0, 8, 0, 4],
    },
  ];
}

function reportFooter(currentPage, pageCount) {
  return {
    columns: [
      {
        text: `Généré le ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
        style: "footerText",
      },
      { text: `Page ${currentPage} / ${pageCount}`, style: "footerText", alignment: "right" },
    ],
    margin: [40, 0, 40, 20],
  };
}

function docToBuffer(docDefinition) {
  return pdfmake.createPdf(docDefinition).getBuffer();
}

function buildInvitedGuestsPdf(invitedGuests) {
  const totalPersons = invitedGuests.reduce((sum, g) => sum + 1 + (g.nombreAccompagnants || 0), 0);

  const byCategory = new Map();
  for (const g of invitedGuests) {
    const key = g.categorie || "Autres";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(g);
  }
  const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b, "fr"));

  const content = [
    ...reportHeader(
      "Liste des invités attendus",
      `${invitedGuests.length} inscrit(s) · ${totalPersons} personne(s) au total (accompagnants inclus)`
    ),
  ];

  if (!categories.length) {
    content.push({ text: "Aucun invité attendu enregistré pour le moment.", style: "emptyNote" });
  }

  for (const categorie of categories) {
    const rows = byCategory
      .get(categorie)
      .sort((a, b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`, "fr"));
    const categoryTotal = rows.reduce((sum, g) => sum + 1 + (g.nombreAccompagnants || 0), 0);

    content.push({ text: categorie, style: "sectionHeading" });
    content.push({ text: `${rows.length} inscrit(s) · ${categoryTotal} personne(s) au total`, style: "sectionMeta" });
    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "*", 90, 55, 45],
        body: [
          [
            { text: "Nom", style: "tableHeader" },
            { text: "Prénom", style: "tableHeader" },
            { text: "Téléphone", style: "tableHeader" },
            { text: "Accomp.", style: "tableHeader", alignment: "center" },
            { text: "Total", style: "tableHeader", alignment: "center" },
          ],
          ...rows.map((g) => [
            { text: g.nom || "—", style: "tableCell" },
            { text: g.prenom || "—", style: "tableCell" },
            { text: g.telephone || "—", style: "tableCell" },
            { text: String(g.nombreAccompagnants || 0), style: "tableCell", alignment: "center" },
            { text: String(1 + (g.nombreAccompagnants || 0)), style: "tableCell", alignment: "center" },
          ]),
        ],
      },
      layout: tableLayoutLight(),
      margin: [0, 0, 0, 4],
    });
  }

  return docToBuffer({
    pageSize: "A4",
    pageMargins: [40, 50, 40, 60],
    footer: reportFooter,
    content,
    styles,
    defaultStyle: { font: "Roboto", fontSize: 10, color: DARK },
  });
}

function buildCommitteePdf(commissions, members) {
  const principal = members
    .filter((m) => !m.commission)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const membersByCommission = new Map();
  for (const m of members) {
    if (!m.commission) continue;
    if (!membersByCommission.has(m.commission)) membersByCommission.set(m.commission, []);
    membersByCommission.get(m.commission).push(m);
  }

  const content = [
    ...reportHeader("Comité d'organisation", `${commissions.length} comité(s) · ${members.length} membre(s)`),
  ];

  if (principal.length) {
    content.push({ text: "Rôles principaux", style: "sectionHeading" });
    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "*", "*"],
        body: [
          [
            { text: "Nom", style: "tableHeader" },
            { text: "Rôle", style: "tableHeader" },
            { text: "Description", style: "tableHeader" },
          ],
          ...principal.map((m) => [
            { text: m.nom, style: "tableCell" },
            { text: m.role || "—", style: "tableCell" },
            { text: m.description || "—", style: "tableCell" },
          ]),
        ],
      },
      layout: tableLayoutLight(),
      margin: [0, 0, 0, 4],
    });
  }

  content.push({ text: "Comités par commission", style: "sectionHeading" });

  if (!commissions.length) {
    content.push({ text: "Aucune commission enregistrée pour le moment.", style: "emptyNote" });
  }

  for (const commission of commissions) {
    const commissionMembers = (membersByCommission.get(commission.nom) || []).sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr")
    );
    const responsableId = commission.responsable ? commission.responsable._id.toString() : null;

    content.push({
      text: [
        { text: commission.nom, bold: true, fontSize: 11, color: DARK },
        commission.responsable
          ? { text: `   Responsable : ${commission.responsable.nom}`, color: MUTED }
          : { text: "   Aucun responsable désigné", color: MUTED, italics: true },
      ],
      margin: [0, 12, 0, 4],
    });

    if (!commissionMembers.length) {
      content.push({ text: "Aucun membre pour le moment.", style: "emptyNote" });
      continue;
    }

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "*"],
        body: [
          [
            { text: "Nom", style: "tableHeader" },
            { text: "Rôle", style: "tableHeader" },
          ],
          ...commissionMembers.map((m) => [
            {
              text: m._id.toString() === responsableId ? `${m.nom}  (responsable)` : m.nom,
              style: "tableCell",
            },
            { text: m.role || "—", style: "tableCell" },
          ]),
        ],
      },
      layout: tableLayoutLight(),
      margin: [0, 0, 0, 4],
    });
  }

  return docToBuffer({
    pageSize: "A4",
    pageMargins: [40, 50, 40, 60],
    footer: reportFooter,
    content,
    styles,
    defaultStyle: { font: "Roboto", fontSize: 10, color: DARK },
  });
}

// Rapport "carte d'invitation" pour le programme du jour J : pensé pour être
// beau et lisible (typographie soignée, accents dorés, timeline en points
// reliés) plutôt qu'un simple export tabulaire comme les deux rapports ci-dessus.
function buildProgramPdf(info) {
  const content = [];

  content.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: 515, h: 2, color: GOLD }],
    margin: [0, 0, 0, 28],
  });

  content.push({ text: "JOELSON  &  MARJORIE", style: "programBrand", alignment: "center" });
  content.push({ text: "Programme du mariage", style: "programTitle", alignment: "center" });
  if (info.dateLabel) {
    content.push({ text: info.dateLabel, style: "programDate", alignment: "center" });
  }

  const infoItems = [];
  if (info.location) infoItems.push({ label: "LIEU", value: info.location });
  if (info.ceremonyTime) infoItems.push({ label: "CÉRÉMONIE", value: info.ceremonyTime });
  if (info.dressCode) infoItems.push({ label: "TENUE", value: info.dressCode });

  if (infoItems.length) {
    content.push({
      columns: infoItems.map((item) => ({
        stack: [
          { text: item.label, style: "infoLabel", alignment: "center" },
          { text: item.value, style: "infoValue", alignment: "center" },
        ],
      })),
      columnGap: 16,
      margin: [40, 26, 40, 26],
    });
  }

  content.push({
    canvas: [{ type: "line", x1: 157, y1: 0, x2: 358, y2: 0, lineWidth: 1, lineColor: GOLD }],
    margin: [0, 0, 0, 26],
  });

  const steps = info.programDetailed || [];
  if (steps.length) {
    content.push({ text: "DÉROULÉ DE LA JOURNÉE", style: "sectionLabel", alignment: "center", margin: [0, 0, 0, 20] });

    for (const step of steps) {
      content.push({
        columns: [
          { width: 60, text: step.time || "", style: "stepTime", alignment: "right" },
          {
            width: 16,
            stack: [{ canvas: [{ type: "ellipse", x: 8, y: 6, r1: 3.5, r2: 3.5, color: GOLD }] }],
          },
          {
            width: "*",
            stack: [
              { text: step.title || "Sans titre", style: "stepTitle" },
              step.description ? { text: step.description, style: "stepDescription" } : null,
            ].filter(Boolean),
          },
        ],
        columnGap: 10,
        margin: [0, 0, 0, 16],
      });
    }
  } else {
    content.push({ text: "Le programme détaillé sera bientôt disponible.", style: "emptyNote", alignment: "center" });
  }

  if (info.quote) {
    content.push({
      canvas: [{ type: "line", x1: 157, y1: 0, x2: 358, y2: 0, lineWidth: 1, lineColor: GOLD }],
      margin: [0, 10, 0, 20],
    });
    content.push({ text: `«  ${info.quote}  »`, style: "quote", alignment: "center" });
    if (info.quoteSource) {
      content.push({ text: `— ${info.quoteSource}`, style: "quoteSource", alignment: "center" });
    }
  }

  return docToBuffer({
    pageSize: "A4",
    pageMargins: [50, 60, 50, 60],
    footer: reportFooter,
    content,
    styles: {
      ...styles,
      programBrand: { fontSize: 10, bold: true, color: MUTED, characterSpacing: 3 },
      programTitle: { fontSize: 26, bold: true, color: DARK, margin: [0, 8, 0, 4] },
      programDate: { fontSize: 12, italics: true, color: GOLD },
      infoLabel: { fontSize: 8, bold: true, color: MUTED, characterSpacing: 1, margin: [0, 0, 0, 4] },
      infoValue: { fontSize: 11, bold: true, color: DARK },
      sectionLabel: { fontSize: 10, bold: true, color: GOLD, characterSpacing: 3 },
      stepTime: { fontSize: 10, bold: true, color: GOLD },
      stepTitle: { fontSize: 12, bold: true, color: DARK },
      stepDescription: { fontSize: 9, color: MUTED, margin: [0, 2, 0, 0] },
      quote: { fontSize: 12, italics: true, color: DARK },
      quoteSource: { fontSize: 9, color: MUTED, margin: [0, 6, 0, 0] },
    },
    defaultStyle: { font: "Roboto", fontSize: 10, color: DARK },
  });
}

module.exports = { buildInvitedGuestsPdf, buildCommitteePdf, buildProgramPdf };
