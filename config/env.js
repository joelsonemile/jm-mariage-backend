require("dotenv").config();

module.exports = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:4200",

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
