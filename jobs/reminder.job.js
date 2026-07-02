const cron = require("node-cron");
const Reservation = require("../models/Reservation");
const WeddingInfo = require("../models/WeddingInfo");
const { RESERVATION_STATUS } = require("../config/constants");
const emailService = require("../services/email.service");

const REMINDER_WINDOW_DAYS = 7;

async function sendRemindersIfDue() {
  const weddingInfo = await WeddingInfo.findOne();
  if (!weddingInfo) return;

  const daysUntilWedding = Math.ceil((weddingInfo.date - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilWedding > REMINDER_WINDOW_DAYS || daysUntilWedding < 0) return;

  const reservations = await Reservation.find({
    status: RESERVATION_STATUS.VALIDATED,
    reminderSentAt: null,
  })
    .populate("guest")
    .populate("table", "name");

  for (const reservation of reservations) {
    await emailService.sendReminderEmail(reservation.guest, reservation, reservation.table, weddingInfo);
    reservation.reminderSentAt = new Date();
    await reservation.save();
  }

  if (reservations.length) {
    console.log(`[reminder] ${reservations.length} email(s) de rappel envoyé(s).`);
  }
}

// Vérifie une fois par jour (08h00) si les invités validés doivent recevoir un rappel.
function scheduleReminderJob() {
  cron.schedule("0 8 * * *", () => {
    sendRemindersIfDue().catch((err) => console.error("[reminder] Erreur:", err.message));
  });
}

module.exports = scheduleReminderJob;
