const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const { ApiError } = require("../utils/apiResponse");
const { RESERVATION_STATUS } = require("../config/constants");
const { emitSeatUpdated, emitReservationNew } = require("../sockets");

// Crée une réservation "en attente". La double protection (vérification applicative +
// index unique partiel Mongo) empêche deux invités de valider la même place en même
// temps : si l'insertion échoue avec le code 11000, la place vient d'être prise.
async function createReservation({ guestId, tableId, seatNumber }) {
  const table = await Table.findById(tableId);
  if (!table) throw new ApiError(404, "Table introuvable.");
  if (table.isHonorTable) throw new ApiError(403, "La Table d'Honneur n'est pas réservable.");
  if (seatNumber < 1 || seatNumber > table.totalSeats) {
    throw new ApiError(400, "Numéro de place invalide.");
  }

  let reservation;
  try {
    reservation = await Reservation.create({
      guest: guestId,
      table: tableId,
      seatNumber,
      status: RESERVATION_STATUS.PENDING,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "Cette place ou votre réservation active existe déjà.");
    }
    throw err;
  }

  emitSeatUpdated(tableId);
  emitReservationNew(reservation);
  return reservation;
}

// Annule la réservation active de l'invité (libère la place immédiatement).
async function cancelActiveReservation(guestId) {
  const reservation = await Reservation.findOne({
    guest: guestId,
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
  });
  if (!reservation) throw new ApiError(404, "Aucune réservation active.");

  reservation.status = RESERVATION_STATUS.CANCELLED;
  await reservation.save();
  emitSeatUpdated(reservation.table);
  return reservation;
}

// Change de place : annule l'ancienne réservation puis en recrée une nouvelle,
// toujours protégée par les mêmes contraintes d'unicité.
async function changeReservation({ guestId, tableId, seatNumber }) {
  await cancelActiveReservation(guestId).catch((err) => {
    if (err.statusCode !== 404) throw err;
  });
  return createReservation({ guestId, tableId, seatNumber });
}

module.exports = { createReservation, cancelActiveReservation, changeReservation };
