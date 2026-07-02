const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { RESERVATION_STATUS } = require("../config/constants");
const reservationService = require("../services/reservation.service");
const qrcodeService = require("../services/qrcode.service");

const create = asyncHandler(async (req, res) => {
  const { tableId, seatNumber } = req.body;
  if (!tableId || !seatNumber) throw new ApiError(400, "Table et numéro de place requis.");

  const reservation = await reservationService.createReservation({
    guestId: req.user._id,
    tableId,
    seatNumber,
  });

  return ok(res, { reservation }, 201);
});

const getMine = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    guest: req.user._id,
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
  }).populate("table", "name description");

  if (!reservation) return ok(res, { reservation: null });

  // Prénoms des autres invités de la même table (respect de la vie privée : prénom uniquement).
  const tableMates = await Reservation.find({
    table: reservation.table._id,
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
    guest: { $ne: req.user._id },
  }).populate("guest", "fullName");

  return ok(res, {
    reservation: {
      id: reservation._id,
      status: reservation.status,
      seatNumber: reservation.seatNumber,
      table: reservation.table,
    },
    tableMates: tableMates.map((r) => r.guest.fullName.split(" ")[0]),
  });
});

const cancel = asyncHandler(async (req, res) => {
  await reservationService.cancelActiveReservation(req.user._id);
  return ok(res, { message: "Réservation annulée." });
});

const change = asyncHandler(async (req, res) => {
  const { tableId, seatNumber } = req.body;
  if (!tableId || !seatNumber) throw new ApiError(400, "Table et numéro de place requis.");

  const reservation = await reservationService.changeReservation({
    guestId: req.user._id,
    tableId,
    seatNumber,
  });
  return ok(res, { reservation });
});

const ticket = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    guest: req.user._id,
    status: RESERVATION_STATUS.VALIDATED,
  }).populate("table", "name");

  if (!reservation) {
    throw new ApiError(403, "Votre réservation n'est pas encore validée par l'administrateur.");
  }

  const qrDataUrl = await qrcodeService.generateQrDataUrl(reservation._id);
  return ok(res, {
    qrDataUrl,
    tableName: reservation.table.name,
    seatNumber: reservation.seatNumber,
  });
});

module.exports = { create, getMine, cancel, change, ticket };
