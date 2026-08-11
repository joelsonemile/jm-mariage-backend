const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    // Le "comité" de cette commission : ses responsables (un ou plusieurs
    // co-responsables, ex: Samuel et Johnathan pour Accueil & Logistique).
    // Chaque membre référencé doit avoir `commission` égal à ce nom.
    responsables: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "CommitteeMember" }], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commission", commissionSchema);
