const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    // Le "comité" de cette commission : son responsable principal, unique.
    // Doit être un CommitteeMember dont le champ `commission` correspond à ce nom.
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: "CommitteeMember", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commission", commissionSchema);
