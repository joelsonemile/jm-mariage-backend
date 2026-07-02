const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { RESERVATION_STATUS } = require("../config/constants");

async function buildOccupancy(tables) {
  const reservations = await Reservation.find({
    table: { $in: tables.map((t) => t._id) },
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
  }).select("table seatNumber guest status");

  const byTable = new Map();
  for (const r of reservations) {
    const key = r.table.toString();
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key).push(r);
  }
  return byTable;
}

const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ order: 1 });
  const occupancy = await buildOccupancy(tables);

  const result = tables.map((t) => {
    const reserved = occupancy.get(t._id.toString()) || [];
    const isMine = reserved.some((r) => r.guest.toString() === req.user._id.toString());
    return {
      id: t._id,
      name: t.name,
      description: t.description,
      isHonorTable: t.isHonorTable,
      totalSeats: t.totalSeats,
      order: t.order,
      reservedCount: reserved.length,
      freeCount: t.totalSeats - reserved.length,
      isMyTable: isMine,
    };
  });

  return ok(res, { tables: result });
});

const getTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, "Table introuvable.");

  const reservations = await Reservation.find({
    table: table._id,
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
  }).populate("guest", "fullName");

  const seats = Array.from({ length: table.totalSeats }, (_, i) => {
    const seatNumber = i + 1;
    const reservation = reservations.find((r) => r.seatNumber === seatNumber);
    if (!reservation) return { seatNumber, status: "available" };

    const isMine = reservation.guest._id.toString() === req.user._id.toString();
    return {
      seatNumber,
      status: isMine ? "mine" : "taken",
      guestFirstName: isMine ? null : reservation.guest.fullName.split(" ")[0],
    };
  });

  return ok(res, {
    table: {
      id: table._id,
      name: table.name,
      description: table.description,
      isHonorTable: table.isHonorTable,
      totalSeats: table.totalSeats,
    },
    seats,
  });
});

module.exports = { listTables, getTable };
