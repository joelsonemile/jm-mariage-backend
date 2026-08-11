const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    isHonorTable: { type: Boolean, default: false },
    totalSeats: { type: Number, required: true },
    order: { type: Number, default: 0 },
    // Table réservée à l'affectation manuelle par l'admin (invités qui ne
    // savent pas utiliser l'application) — invisible dans le plan des invités.
    adminOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
