const { verifyToken } = require("../utils/jwt.util");
const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new ApiError(401, "Authentification requise.");

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, "Session invalide ou expirée.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Utilisateur introuvable.");

  req.user = user;
  next();
});

module.exports = requireAuth;
