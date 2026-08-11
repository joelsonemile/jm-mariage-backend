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
  const isAdmin = req.user.role === "admin";
  const tables = await Table.find(isAdmin ? {} : { adminOnly: { $ne: true } }).sort({ order: 1 });
  const occupancy = await buildOccupancy(tables);

  const result = tables.map((t) => {
    const reserved = occupancy.get(t._id.toString()) || [];
    const isMine = reserved.some((r) => r.guest.toString() === req.user._id.toString());
    return {
      id: t._id,
      name: t.name,
      description: t.description,
      isHonorTable: t.isHonorTable,
      adminOnly: t.adminOnly,
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
  if (table.adminOnly && req.user.role !== "admin") {
    throw new ApiError(403, "Cette table est réservée à l'administration.");
  }

  const reservations = await Reservation.find({
    table: table._id,
    status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED] },
  }).populate("guest", "fullName");

  const seats = Array.from({ length: table.totalSeats }, (_, i) => {
    const seatNumber = i + 1;
    const reservation = reservations.find((r) => r.seatNumber === seatNumber);
    if (!reservation) return { seatNumber, status: "available" };

    const isMine = reservation.guest._id.toString() === req.user._id.toString();
    const fullName = reservation.companionName || reservation.guest.fullName;
    return {
      seatNumber,
      status: isMine ? "mine" : "taken",
      // Le prénom (ou le nom du companion) reste affiché par défaut ; le nom
      // complet n'est révélé qu'au clic, pour un plan de table plus discret.
      guestFirstName: isMine ? null : fullName.split(" ")[0],
      guestFullName: isMine ? null : fullName,
    };
  });

  return ok(res, {
    table: {
      id: table._id,
      name: table.name,
      description: table.description,
      isHonorTable: table.isHonorTable,
      adminOnly: table.adminOnly,
      totalSeats: table.totalSeats,
    },
    seats,
  });
});

module.exports = { listTables, getTable };
