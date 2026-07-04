const mongoose = require("mongoose");

const invitedGuestSchema = new mongoose.Schema(
  {
    nom: { type: String, default: "" },
    prenom: { type: String, default: "" },
    telephone: { type: String, default: "" },
    categorie: { type: String, default: "Autres" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvitedGuest", invitedGuestSchema);
