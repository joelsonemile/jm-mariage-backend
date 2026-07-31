const Reservation = require("../models/Reservation");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { RESERVATION_STATUS } = require("../config/constants");
const reservationService = require("../services/reservation.service");
const qrcodeService = require("../services/qrcode.service");

const ACTIVE_STATUSES = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED];

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
  const reservations = await Reservation.find({
    guest: req.user._id,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ createdAt: 1 })
    .populate("table", "name description");

  const tableIds = reservations.map((r) => r.table._id);
  const tableMatesDocs = tableIds.length
    ? await Reservation.find({
        table: { $in: tableIds },
        status: { $in: ACTIVE_STATUSES },
        guest: { $ne: req.user._id },
      }).populate("guest", "fullName")
    : [];

  const tableMatesByTable = new Map();
  for (const r of tableMatesDocs) {
    const key = r.table.toString();
    if (!tableMatesByTable.has(key)) tableMatesByTable.set(key, []);
    tableMatesByTable.get(key).push(r.guest.fullName.split(" ")[0]);
  }

  return ok(res, {
    groupSize: req.user.groupSize,
    reservations: reservations.map((r) => ({
      id: r._id,
      status: r.status,
      seatNumber: r.seatNumber,
      table: r.table,
      tableMates: tableMatesByTable.get(r.table._id.toString()) || [],
    })),
  });
});

const cancel = asyncHandler(async (req, res) => {
  await reservationService.cancelReservation(req.user._id, req.params.id);
  return ok(res, { message: "Réservation annulée." });
});

const change = asyncHandler(async (req, res) => {
  const { tableId, seatNumber } = req.body;
  if (!tableId || !seatNumber) throw new ApiError(400, "Table et numéro de place requis.");

  const reservation = await reservationService.changeReservation({
    guestId: req.user._id,
    reservationId: req.params.id,
    tableId,
    seatNumber,
  });
  return ok(res, { reservation });
});

const ticket = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    guest: req.user._id,
    status: RESERVATION_STATUS.VALIDATED,
  }).populate("table", "name");

  if (!reservation) {
    throw new ApiError(403, "Cette réservation n'est pas (encore) validée par l'administrateur.");
  }

  const qrDataUrl = await qrcodeService.generateQrDataUrl(reservation._id);
  return ok(res, {
    qrDataUrl,
    tableName: reservation.table.name,
    seatNumber: reservation.seatNumber,
  });
});

module.exports = { create, getMine, cancel, change, ticket };
