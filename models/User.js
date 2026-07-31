const mongoose = require("mongoose");
const { ROLES, LINKS_TO_COUPLE, RSVP_STATUS } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.GUEST },
    linkToCouple: { type: String, enum: LINKS_TO_COUPLE, default: "Autres" },
    profilePhoto: { type: String, default: null },
    rsvpStatus: { type: String, enum: Object.values(RSVP_STATUS), default: RSVP_STATUS.PENDING },
    // Nombre de places que ce compte souhaite réserver (lui-même inclus).
    groupSize: { type: Number, default: 1, min: 1 },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
