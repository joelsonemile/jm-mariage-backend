const mongoose = require("mongoose");
const { RESERVATION_STATUS } = require("../config/constants");

const reservationSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    seatNumber: { type: Number, required: true },
    // Optionnel : nom de la personne qui occupe réellement cette place quand le
    // compte réserve pour plusieurs invités (sinon, c'est le titulaire du compte).
    companionName: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.PENDING,
    },
    validatedAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Un même siège ne peut être occupé (en attente ou validé) que par une seule réservation à la fois.
// Contrainte appliquée au niveau base de données, pas seulement côté applicatif.
reservationSchema.index(
  { table: 1, seatNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
    },
  }
);

// Un invité peut réserver plusieurs places (jusqu'à son "groupSize" déclaré,
// vérifié côté service) — donc pas d'unicité sur `guest` seul ici.
reservationSchema.index({ guest: 1, status: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
