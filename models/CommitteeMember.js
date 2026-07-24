const mongoose = require("mongoose");

const committeeMemberSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    description: { type: String, default: "" },
    commission: { type: String, default: "" },
    ordre: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommitteeMember", committeeMemberSchema);
