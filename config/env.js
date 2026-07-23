require("dotenv").config();

// CLIENT_URL accepte une liste séparée par des virgules (dev local + domaine Vercel
// de prod, éventuellement des URLs de preview) — le premier sert de valeur par défaut
// unique (ex: lien de réinitialisation de mot de passe).
const clientUrls = (process.env.CLIENT_URL || "http://localhost:4200")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

module.exports = {
  port: process.env.PORT || 4000,
  clientUrl: clientUrls[0],
  clientUrls,

  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  adminEmail: process.env.ADMIN_EMAIL || "admin@jway.ma",
  adminPassword: process.env.ADMIN_PASSWORD || "password",
  adminName: process.env.ADMIN_NAME || "Administration JM",

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM || "Joelson & Marjorie <no-reply@jm-mariage.com>",
};
