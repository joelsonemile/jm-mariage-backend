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
  // Styles "carton d'invitation" partagés par les exports au style plus soigné
  // (programme, plan des tables) : marque + titre centrés, mini-stats en colonnes.
  programBrand: { fontSize: 10, bold: true, color: MUTED, characterSpacing: 3 },
  programTitle: { fontSize: 25, bold: true, color: DARK, margin: [0, 8, 0, 4] },
  programDate: { fontSize: 12, italics: true, color: GOLD },
  infoLabel: { fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 1, margin: [0, 0, 0, 4] },
  infoValue: { fontSize: 11, bold: true, color: DARK },
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

// Cadre décoratif fin en fond de page (indépendant du flux du contenu) pour un
// rendu "carton d'invitation" plutôt que "rapport" — réutilisé par tous les
// exports qui veulent ce style plus soigné qu'un simple rapport tabulaire.
function decorativeFrame(_currentPage, pageSize) {
  return {
    canvas: [
      {
        type: "rect",
        x: 24,
        y: 24,
        w: pageSize.width - 48,
        h: pageSize.height - 48,
        lineColor: "#d9c98a",
        lineWidth: 1,
      },
      {
        type: "rect",
        x: 28,
        y: 28,
        w: pageSize.width - 56,
        h: pageSize.height - 56,
        lineColor: "#d9c98a",
        lineWidth: 0.5,
      },
    ],
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
    const responsables = commission.responsables || [];
    const responsableIds = new Set(responsables.map((r) => r._id.toString()));

    content.push({
      text: [
        { text: commission.nom, bold: true, fontSize: 11, color: DARK },
        responsables.length
          ? { text: `   Responsable(s) : ${responsables.map((r) => r.nom).join(", ")}`, color: MUTED }
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
              text: responsableIds.has(m._id.toString()) ? `${m.nom}  (responsable)` : m.nom,
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
// Regroupe une liste d'étapes par une clé (section ou sous-programme) en
// conservant l'ordre d'apparition — réutilisé pour le niveau "section".
function groupByOrdered(list, keyFn) {
  const order = [];
  const byKey = new Map();
  for (const item of list) {
    const key = keyFn(item);
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key).push(item);
  }
  return order.map((key) => ({ key, items: byKey.get(key) }));
}

// Regroupe par SUITE CONSÉCUTIVE (pas par fusion globale de la même clé) : un
// sous-programme inséré entre deux étapes "libres" doit rester à sa place
// chronologique plutôt que de fusionner avec un groupe "libre" antérieur.
function groupConsecutive(list, keyFn) {
  const groups = [];
  for (const item of list) {
    const key = keyFn(item);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

function buildProgramPdf(info) {
  const content = [];

  content.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: 491, h: 1.5, color: GOLD }],
    margin: [0, 0, 0, 8],
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
      columnGap: 14,
      margin: [30, 8, 30, 8],
    });
  }

  content.push({
    canvas: [{ type: "line", x1: 171, y1: 0, x2: 320, y2: 0, lineWidth: 1, lineColor: GOLD }],
    margin: [0, 0, 0, 10],
  });

  // Une étape tient sur une seule ligne fluide "• HEURE · Titre" (pas de colonnes
  // rigides) pour bien s'accommoder d'une colonne étroite sans retour à la ligne
  // disgracieux sur l'heure. "•" (U+2022) est utilisé plutôt que "●" (U+25CF) car
  // seul le premier existe dans l'encodage WinAnsi des polices standard PDF.
  const renderStepRow = (step) => {
    const parts = [{ text: "•  ", color: GOLD, fontSize: 9 }];
    if (step.time) parts.push({ text: `${step.time}   ·   `, style: "stepTime" });
    parts.push({ text: step.title || "Sans titre", style: "stepTitle" });
    content.push({
      text: parts,
      margin: [0, 0, 0, step.description ? 1 : 4],
    });
    if (step.description) {
      content.push({ text: step.description, style: "stepDescription", margin: [13, 0, 0, 4] });
    }
  };

  // Bloc encadré doré distinguant visuellement un sous-programme (ex: "PROGRAMME
  // - DINER DE MARIAGE (20h45 - 22h00)") du reste des étapes de la section.
  const renderSubProgramBox = (title, steps) => {
    const before = content.length;
    content.push({ text: title, style: "subProgramLabel", margin: [0, 0, 0, 4] });
    for (const step of steps) renderStepRow(step);
    const boxed = content.splice(before);
    content.push({
      table: { widths: ["*"], body: [[{ stack: boxed, border: [true, true, true, true] }]] },
      layout: {
        hLineColor: () => GOLD,
        vLineColor: () => GOLD,
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 5,
        paddingBottom: () => 1,
      },
      margin: [0, 2, 0, 4],
    });
  };

  const renderSection = (sectionName, sectionSteps, showLabel) => {
    const stack = [];
    const before = content.length;
    if (showLabel) {
      content.push({ text: sectionName.toUpperCase(), style: "sectionLabel", margin: [0, 0, 0, 6] });
    }

    // Les étapes rattachées à un sous-programme sont détaillées dans un encadré
    // dédié ; celles sans sous-programme restent directement dans la section.
    // Regroupées par suite consécutive pour garder l'ordre chronologique exact.
    const subGroups = groupConsecutive(sectionSteps, (step) => step.subProgram || "");
    for (const { key: subProgramName, items: subSteps } of subGroups) {
      if (subProgramName) renderSubProgramBox(subProgramName, subSteps);
      else for (const step of subSteps) renderStepRow(step);
    }
    stack.push(...content.splice(before));
    return stack;
  };

  const steps = info.programDetailed || [];
  if (steps.length) {
    // Regroupe par "acte" (Journée / Soirée / ...) dans leur ordre d'apparition ;
    // les étapes sans section tombent dans un groupe "" affiché sans double-titre
    // quand c'est le seul groupe du programme.
    const sectionGroups = groupByOrdered(steps, (step) => step.section || "");
    const showLabels = sectionGroups.length > 1 || !!sectionGroups[0]?.key;

    if (sectionGroups.length > 1) {
      // Une colonne par acte, côte à côte : c'est ce qui permet de tenir le
      // programme complet sur une seule page tout en séparant clairement Journée
      // et Soirée (et donc, à l'intérieur, chaque sous-programme).
      content.push({
        columns: sectionGroups.map(({ key: sectionName, items: sectionSteps }) => ({
          width: "*",
          stack: renderSection(sectionName || "Programme", sectionSteps, showLabels),
        })),
        columnGap: 22,
      });
    } else {
      content.push(...renderSection(sectionGroups[0]?.key || "Programme", sectionGroups[0]?.items || [], showLabels));
    }
  } else {
    content.push({ text: "Le programme détaillé sera bientôt disponible.", style: "emptyNote", alignment: "center" });
  }

  if (info.quote) {
    content.push({
      canvas: [{ type: "line", x1: 171, y1: 0, x2: 320, y2: 0, lineWidth: 1, lineColor: GOLD }],
      margin: [0, 4, 0, 4],
    });
    content.push({ text: `«  ${info.quote}  »`, style: "quote", alignment: "center" });
    if (info.quoteSource) {
      content.push({ text: `— ${info.quoteSource}`, style: "quoteSource", alignment: "center" });
    }
  }

  return docToBuffer({
    pageSize: "A4",
    pageMargins: [48, 34, 48, 28],
    background: decorativeFrame,
    footer: reportFooter,
    content,
    styles: {
      ...styles,
      programTitle: { fontSize: 25, bold: true, color: DARK, margin: [0, 8, 0, 4] },
      sectionLabel: { fontSize: 12, bold: true, color: GOLD, characterSpacing: 3 },
      subProgramLabel: { fontSize: 9.5, bold: true, color: GOLD, characterSpacing: 0.75 },
      stepTime: { fontSize: 9.5, bold: true, color: GOLD },
      stepTitle: { fontSize: 10.5, bold: true, color: DARK },
      stepDescription: { fontSize: 8.5, color: MUTED, italics: true },
      quote: { fontSize: 12.5, italics: true, color: DARK },
      quoteSource: { fontSize: 9, color: MUTED, margin: [0, 5, 0, 0] },
    },
    defaultStyle: { font: "Roboto", fontSize: 10 },
  });
}

// Plan des tables : une fiche par table (nom + liste de toutes les places,
// occupées ou libres) rangées 2x2, soit 4 tables par page — pratique à
// imprimer et à poser près de chaque table le jour J.
function buildTablesPdf(tables, reservationsByTableId) {
  const content = [];

  content.push({
    canvas: [{ type: "rect", x: 0, y: 0, w: 491, h: 1.5, color: GOLD }],
    margin: [0, 0, 0, 8],
  });
  content.push({ text: "JOELSON  &  MARJORIE", style: "programBrand", alignment: "center" });
  content.push({ text: "Plan des tables", style: "programTitle", alignment: "center" });
  content.push({ text: `${tables.length} table(s)`, style: "programDate", alignment: "center" });

  const totalSeats = tables.reduce((sum, t) => sum + t.totalSeats, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + (reservationsByTableId.get(t.id.toString())?.length || 0), 0);
  const totalFree = totalSeats - totalOccupied;

  content.push({
    columns: [
      { stack: [{ text: "PLACES AU TOTAL", style: "infoLabel", alignment: "center" }, { text: String(totalSeats), style: "infoValue", alignment: "center" }] },
      { stack: [{ text: "PLACES OCCUPÉES", style: "infoLabel", alignment: "center" }, { text: String(totalOccupied), style: "summaryOccupied", alignment: "center" }] },
      { stack: [{ text: "PLACES LIBRES", style: "infoLabel", alignment: "center" }, { text: String(totalFree), style: "summaryFree", alignment: "center" }] },
    ],
    columnGap: 14,
    margin: [30, 12, 30, 12],
  });

  content.push({
    canvas: [{ type: "line", x1: 171, y1: 0, x2: 320, y2: 0, lineWidth: 1, lineColor: GOLD }],
    margin: [0, 0, 0, 16],
  });

  const CARD_WIDTH = 233;

  // Un nom trop long revient à la ligne et casse l'alignement des deux cartes
  // d'une même rangée (pdfmake ne peut pas les forcer à la même hauteur si leur
  // contenu diffère) — on tronque donc plutôt que de laisser une carte grandir.
  // On retire aussi les caractères hors WinAnsi (emoji...) qui s'affichent en
  // glyphes cassés avec les polices standard PDF (seuls é/è/à/ç... sont couverts).
  const cleanName = (name) =>
    name
      .replace(/[^ -ÿ]/gu, "")
      .replace(/\s+/g, " ")
      .trim() || "Invité";
  const truncateName = (name) => {
    const clean = cleanName(name);
    return clean.length > 20 ? `${clean.slice(0, 19)}…` : clean;
  };

  const renderTableCard = (table) => {
    const reservations = (reservationsByTableId.get(table.id.toString()) || []).slice().sort((a, b) => a.seatNumber - b.seatNumber);
    const bySeat = new Map(reservations.map((r) => [r.seatNumber, r]));

    const header = {
      text: [
        { text: table.name, style: "cardTableName" },
        table.adminOnly ? { text: "  ADMIN", style: "cardAdminTag" } : null,
      ].filter(Boolean),
      margin: [0, 0, 0, 6],
    };
    const meta = {
      text: `${reservations.length}/${table.totalSeats} places occupées`,
      style: "cardMeta",
      margin: [0, 0, 0, 16],
    };

    const seatRows = [];
    for (let n = 1; n <= table.totalSeats; n++) {
      const r = bySeat.get(n);
      if (r) {
        const name = truncateName(r.companionName || r.guest?.fullName || "—");
        seatRows.push({
          text: [
            { text: `#${n}    `, style: "cardSeatNum" },
            { text: name, style: "cardSeatName" },
          ],
          margin: [0, 0, 0, 11],
        });
      } else {
        seatRows.push({ text: `#${n}    Libre`, style: "cardSeatEmpty", margin: [0, 0, 0, 11] });
      }
    }

    return {
      width: CARD_WIDTH,
      table: { widths: ["*"], body: [[{ stack: [header, meta, ...seatRows], border: [true, true, true, true] }]] },
      layout: {
        hLineColor: () => GOLD,
        vLineColor: () => GOLD,
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        paddingLeft: () => 18,
        paddingRight: () => 18,
        paddingTop: () => 20,
        paddingBottom: () => 18,
      },
    };
  };

  for (let i = 0; i < tables.length; i += 4) {
    const group = tables.slice(i, i + 4);
    for (let j = 0; j < group.length; j += 2) {
      const rowTables = group.slice(j, j + 2);
      content.push({
        columns: rowTables.map(renderTableCard),
        columnGap: 25,
        margin: [0, 0, 0, 30],
        pageBreak: i > 0 && j === 0 ? "before" : undefined,
      });
    }
  }

  return docToBuffer({
    pageSize: "A4",
    pageMargins: [48, 34, 48, 28],
    background: decorativeFrame,
    footer: reportFooter,
    content,
    styles: {
      ...styles,
      programTitle: { fontSize: 22, bold: true, color: DARK, margin: [0, 8, 0, 4] },
      programDate: { fontSize: 10, italics: true, color: GOLD },
      summaryOccupied: { fontSize: 15, bold: true, color: "#b45309" },
      summaryFree: { fontSize: 15, bold: true, color: "#15803d" },
      cardTableName: { fontSize: 18, bold: true, color: DARK },
      cardAdminTag: { fontSize: 9, bold: true, color: GOLD },
      cardMeta: { fontSize: 10, color: MUTED },
      cardSeatNum: { fontSize: 13, bold: true, color: GOLD },
      cardSeatName: { fontSize: 13, color: DARK },
      cardSeatEmpty: { fontSize: 13, italics: true, color: MUTED },
    },
    defaultStyle: { font: "Roboto", fontSize: 10 },
  });
}

module.exports = { buildInvitedGuestsPdf, buildCommitteePdf, buildProgramPdf, buildTablesPdf };
