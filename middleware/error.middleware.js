const { ApiError } = require("../utils/apiResponse");

module.exports = function errorHandler(err, req, res, next) {
  if (err && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Cette place vient d'être réservée par quelqu'un d'autre. Veuillez en choisir une autre.",
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: "Erreur serveur." });
};
