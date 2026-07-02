const { ApiError } = require("../utils/apiResponse");

// Verrouille l'accès aux routes admin : aucune route/fonctionnalité admin
// ne doit être atteignable par un compte invité (cf. cahier des charges §8.6).
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "Accès refusé.");
  }
  next();
};

module.exports = requireRole;
