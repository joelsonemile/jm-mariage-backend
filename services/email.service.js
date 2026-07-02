const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { smtp, emailFrom, clientUrl } = require("../config/env");
const qrcodeService = require("./qrcode.service");

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.port === 465,
  auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
});

function renderTemplate(templateName, replacements) {
  const filePath = path.join(__dirname, "..", "templates", templateName);
  let html = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  }
  return html;
}

async function safeSend(mailOptions) {
  if (!smtp.host) {
    console.warn(`[email] SMTP non configuré — envoi ignoré (destinataire: ${mailOptions.to})`);
    return;
  }
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[email] Échec de l'envoi:", err.message);
  }
}

async function sendConfirmationEmail(user, reservation, table) {
  const qrBuffer = await qrcodeService.generateQrBuffer(reservation._id);
  const html = renderTemplate("confirmation-email.html", {
    fullName: user.fullName,
    tableName: table.name,
    seatNumber: reservation.seatNumber,
  });

  await safeSend({
    from: emailFrom,
    to: user.email,
    subject: "Votre place au mariage de Joelson & Marjorie est confirmée",
    html,
    attachments: [{ filename: "qrcode.png", content: qrBuffer, cid: "qrcode" }],
  });
}

async function sendReminderEmail(user, reservation, table, weddingInfo) {
  const html = renderTemplate("reminder-email.html", {
    fullName: user.fullName,
    dateLabel: weddingInfo.dateLabel,
    location: weddingInfo.location,
    tableName: table.name,
    seatNumber: reservation.seatNumber,
  });

  await safeSend({
    from: emailFrom,
    to: user.email,
    subject: "Le grand jour approche — Mariage de Joelson & Marjorie",
    html,
  });
}

async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${clientUrl}/auth/reset-password?token=${rawToken}`;
  const html = `
    <div style="background:#0A0A0A;padding:32px;font-family:Arial,sans-serif;color:#F5F5F5;">
      <h2 style="color:#C9A84C;">JM — Joelson &amp; Marjorie</h2>
      <p>Bonjour ${user.fullName},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Ce lien expire dans 1 heure :</p>
      <p><a href="${resetUrl}" style="color:#FFD700;">${resetUrl}</a></p>
      <p style="color:#888888;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>`;

  await safeSend({
    from: emailFrom,
    to: user.email,
    subject: "Réinitialisation de votre mot de passe",
    html,
  });
}

module.exports = { sendConfirmationEmail, sendReminderEmail, sendPasswordResetEmail };
