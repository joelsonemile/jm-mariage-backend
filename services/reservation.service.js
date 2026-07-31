const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const User = require("../models/User");
const { ApiError } = require("../utils/apiResponse");
const { RESERVATION_STATUS } = require("../config/constants");
const { emitSeatUpdated, emitReservationNew } = require("../sockets");

const ACTIVE_STATUSES = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED];

// Crée une réservation "en attente" pour l'invité, en respectant le nombre de
// places qu'il a déclaré vouloir réserver (lui + ses accompagnants). La double
// protection (vérification applicative + index unique partiel Mongo sur
// {table, seatNumber}) empêche deux invités de valider la même place en même
// temps : si l'insertion échoue avec le code 11000, la place vient d'être prise.
async function createReservation({ guestId, tableId, seatNumber, companionName }) {
  const table = await Table.findById(tableId);
  if (!table) throw new ApiError(404, "Table introuvable.");
  if (table.isHonorTable) throw new ApiError(403, "La Table d'Honneur n'est pas réservable.");
  if (seatNumber < 1 || seatNumber > table.totalSeats) {
    throw new ApiError(400, "Numéro de place invalide.");
  }

  const [user, activeCount] = await Promise.all([
    User.findById(guestId),
    Reservation.countDocuments({ guest: guestId, status: { $in: ACTIVE_STATUSES } }),
  ]);

  if (activeCount >= user.groupSize) {
    throw new ApiError(
      400,
      `Vous avez déjà réservé ${activeCount} place(s) sur les ${user.groupSize} déclarée(s). Augmentez le nombre d'invités pour réserver une place de plus.`
    );
  }

  let reservation;
  try {
    reservation = await Reservation.create({
      guest: guestId,
      table: tableId,
      seatNumber,
      companionName: (companionName || "").trim(),
      status: RESERVATION_STATUS.PENDING,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "Cette place vient d'être réservée par quelqu'un d'autre.");
    }
    throw err;
  }

  emitSeatUpdated(tableId);
  emitReservationNew(reservation);
  return reservation;
}

// Annule une réservation active précise de l'invité (libère la place immédiatement).
async function cancelReservation(guestId, reservationId) {
  const reservation = await Reservation.findOne({
    _id: reservationId,
    guest: guestId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (!reservation) throw new ApiError(404, "Réservation introuvable.");

  reservation.status = RESERVATION_STATUS.CANCELLED;
  await reservation.save();
  emitSeatUpdated(reservation.table);
  return reservation;
}

// Change de place pour une réservation précise : annule l'ancienne puis en
// recrée une nouvelle, toujours protégée par les mêmes contraintes d'unicité.
async function changeReservation({ guestId, reservationId, tableId, seatNumber }) {
  const previous = await cancelReservation(guestId, reservationId);
  return createReservation({ guestId, tableId, seatNumber, companionName: previous.companionName });
}

module.exports = { createReservation, cancelReservation, changeReservation };
