const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commission", commissionSchema);
