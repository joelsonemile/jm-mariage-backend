const mongoose = require("mongoose");

const programStepSchema = new mongoose.Schema({
  time: { type: String, default: "" },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  // Regroupe les étapes par grand moment (ex: "Journée" / "Soirée") pour un
  // affichage en actes plutôt qu'une liste plate. Vide = pas de section.
  section: { type: String, default: "" },
  // Sous-groupe optionnel à l'intérieur d'une section (ex: "PROGRAMME - DINER
  // DE MARIAGE (20h45 - 22h00)") pour détailler un bloc précis du déroulé sans
  // sortir de son acte. Vide = étape directement dans la section.
  subProgram: { type: String, default: "" },
});

const weddingInfoSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    dateLabel: { type: String, default: "" },
    ceremonyTime: { type: String, default: "" },
    location: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    programSummary: { type: String, default: "" },
    programDetailed: { type: [programStepSchema], default: [] },
    coupleMessage: { type: String, default: "" },
    coupleImage: { type: String, default: "" },
    quote: { type: String, default: "" },
    quoteSource: { type: String, default: "" },
    giftRegistry: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeddingInfo", weddingInfoSchema);
