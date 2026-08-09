const mongoose = require("mongoose");

const invitedGuestSchema = new mongoose.Schema(
  {
    nom: { type: String, default: "" },
    prenom: { type: String, default: "" },
    telephone: { type: String, default: "" },
    categorie: { type: String, default: "Autres" },
    // Nombre de personnes que cet invité peut amener avec lui (hors lui-même).
    nombreAccompagnants: { type: Number, default: 0, min: 0 },
    invitationSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvitedGuest", invitedGuestSchema);
