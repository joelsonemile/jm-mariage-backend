const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { signToken } = require("../utils/jwt.util");
const emailService = require("../services/email.service");

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    linkToCouple: user.linkToCouple,
    profilePhoto: user.profilePhoto,
    rsvpStatus: user.rsvpStatus,
  };
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, confirmPassword, linkToCouple } = req.body;

  if (!fullName || !email || !phone || !password) {
    throw new ApiError(400, "Tous les champs sont requis.");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "Les mots de passe ne correspondent pas.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Un compte existe déjà avec cet email.");

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    password: hashed,
    linkToCouple,
  });

  const token = signToken({ sub: user._id.toString(), role: user.role });
  return ok(res, { token, user: toPublicUser(user) }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email et mot de passe requis.");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw new ApiError(401, "Email ou mot de passe incorrect.");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, "Email ou mot de passe incorrect.");

  const token = signToken({ sub: user._id.toString(), role: user.role });
  return ok(res, { token, user: toPublicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { user: toPublicUser(req.user) });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });

  // Réponse identique que le compte existe ou non, pour ne pas divulguer d'information.
  if (!user) return ok(res, { message: "Si un compte existe, un email a été envoyé." });

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await emailService.sendPasswordResetEmail(user, rawToken);
  return ok(res, { message: "Si un compte existe, un email a été envoyé." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, "Token et nouveau mot de passe requis.");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (!user) throw new ApiError(400, "Lien de réinitialisation invalide ou expiré.");

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return ok(res, { message: "Mot de passe mis à jour." });
});

module.exports = { register, login, me, forgotPassword, resetPassword, toPublicUser };
