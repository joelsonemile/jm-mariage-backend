const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const InvitedGuest = require("../models/InvitedGuest");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { ROLES, RESERVATION_STATUS } = require("../config/constants");
const { emitSeatUpdated } = require("../sockets");
const emailService = require("../services/email.service");
const exportService = require("../services/export.service");

const ACTIVE_STATUSES = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.VALIDATED];

const dashboard = asyncHandler(async (req, res) => {
  const [totalGuests, activeReservations, tables] = await Promise.all([
    User.countDocuments({ role: ROLES.GUEST }),
    Reservation.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
    Table.find({ isHonorTable: false }),
  ]);

  const totalSeats = tables.reduce((sum, t) => sum + t.totalSeats, 0);
  const reservationsByTable = await Reservation.aggregate([
    { $match: { status: { $in: ACTIVE_STATUSES } } },
    { $group: { _id: "$table", count: { $sum: 1 } } },
  ]);
  const countByTable = new Map(reservationsByTable.map((r) => [r._id.toString(), r.count]));
  const fullTables = tables.filter((t) => (countByTable.get(t._id.toString()) || 0) >= t.totalSeats).length;

  const pendingCount = await Reservation.countDocuments({ status: RESERVATION_STATUS.PENDING });

  return ok(res, {
    stats: {
      totalGuests,
      pendingCount,
      validatedCount: activeReservations - pendingCount,
      freeSeats: totalSeats - activeReservations,
      reservedSeats: activeReservations,
      totalSeats,
      fullTables,
    },
  });
});

const listReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter)
    .sort({ createdAt: -1 })
    .populate("guest", "fullName phone email linkToCouple")
    .populate("table", "name");

  return ok(res, { reservations });
});

const approveReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate("guest").populate("table");
  if (!reservation) throw new ApiError(404, "Réservation introuvable.");

  reservation.status = RESERVATION_STATUS.VALIDATED;
  reservation.validatedAt = new Date();
  await reservation.save();

  emitSeatUpdated(reservation.table._id);
  await emailService.sendConfirmationEmail(reservation.guest, reservation, reservation.table);

  return ok(res, { reservation });
});

const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) throw new ApiError(404, "Réservation introuvable.");

  emitSeatUpdated(reservation.table);
  return ok(res, { message: "Réservation supprimée." });
});

const createReservationManual = asyncHandler(async (req, res) => {
  const { guestId, tableId, seatNumber, status } = req.body;
  if (!guestId || !tableId || !seatNumber) throw new ApiError(400, "Invité, table et place requis.");

  let reservation;
  try {
    reservation = await Reservation.create({
      guest: guestId,
      table: tableId,
      seatNumber,
      status: status === RESERVATION_STATUS.VALIDATED ? RESERVATION_STATUS.VALIDATED : RESERVATION_STATUS.PENDING,
      validatedAt: status === RESERVATION_STATUS.VALIDATED ? new Date() : null,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Cette place ou cet invité a déjà une réservation active.");
    throw err;
  }

  emitSeatUpdated(tableId);
  return ok(res, { reservation }, 201);
});

const moveReservation = asyncHandler(async (req, res) => {
  const { tableId, seatNumber } = req.body;
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, "Réservation introuvable.");

  const previousTable = reservation.table;
  reservation.table = tableId;
  reservation.seatNumber = seatNumber;

  try {
    await reservation.save();
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Cette place est déjà occupée.");
    throw err;
  }

  emitSeatUpdated(previousTable);
  emitSeatUpdated(tableId);
  return ok(res, { reservation });
});

const listGuests = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const filter = {
    role: ROLES.GUEST,
    ...(search
      ? { $or: [{ fullName: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
      : {}),
  };

  const guests = await User.find(filter).sort({ createdAt: -1 });
  const reservations = await Reservation.find({ status: { $in: ACTIVE_STATUSES } }).populate("table", "name");
  const byGuest = new Map(reservations.map((r) => [r.guest.toString(), r]));

  const result = guests.map((g) => {
    const reservation = byGuest.get(g._id.toString());
    return {
      id: g._id,
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      linkToCouple: g.linkToCouple,
      rsvpStatus: g.rsvpStatus,
      reservation: reservation
        ? { id: reservation._id, tableName: reservation.table.name, seatNumber: reservation.seatNumber, status: reservation.status }
        : null,
    };
  });

  return ok(res, { guests: result });
});

const createGuest = asyncHandler(async (req, res) => {
  const { fullName, email, phone, linkToCouple } = req.body;
  if (!fullName || !email || !phone) throw new ApiError(400, "Nom, email et téléphone requis.");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Un compte existe déjà avec cet email.");

  const temporaryPassword = crypto.randomBytes(6).toString("hex");
  const hashed = await bcrypt.hash(temporaryPassword, 10);

  const guest = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    linkToCouple,
    password: hashed,
    role: ROLES.GUEST,
  });

  return ok(res, { guest }, 201);
});

const updateGuest = asyncHandler(async (req, res) => {
  const { fullName, phone, linkToCouple, email } = req.body;
  const guest = await User.findOne({ _id: req.params.id, role: ROLES.GUEST });
  if (!guest) throw new ApiError(404, "Invité introuvable.");

  if (fullName) guest.fullName = fullName;
  if (phone) guest.phone = phone;
  if (linkToCouple) guest.linkToCouple = linkToCouple;
  if (email) guest.email = email.toLowerCase();

  await guest.save();
  return ok(res, { guest });
});

const deleteGuest = asyncHandler(async (req, res) => {
  const guest = await User.findOneAndDelete({ _id: req.params.id, role: ROLES.GUEST });
  if (!guest) throw new ApiError(404, "Invité introuvable.");

  const activeReservation = await Reservation.findOneAndDelete({
    guest: guest._id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (activeReservation) emitSeatUpdated(activeReservation.table);

  return ok(res, { message: "Invité supprimé." });
});

const listInvitedGuests = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const filter = search
    ? {
        $or: [
          { nom: new RegExp(search, "i") },
          { prenom: new RegExp(search, "i") },
          { telephone: new RegExp(search, "i") },
        ],
      }
    : {};

  const invitedGuests = await InvitedGuest.find(filter).sort({ nom: 1, prenom: 1 });
  return ok(res, { invitedGuests });
});

const createInvitedGuest = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  if (!nom && !prenom) throw new ApiError(400, "Nom ou prénom requis.");

  const invitedGuest = await InvitedGuest.create({
    nom: nom || "",
    prenom: prenom || "",
    telephone: telephone || "",
  });

  return ok(res, { invitedGuest }, 201);
});

const updateInvitedGuest = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  const invitedGuest = await InvitedGuest.findById(req.params.id);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  if (nom !== undefined) invitedGuest.nom = nom;
  if (prenom !== undefined) invitedGuest.prenom = prenom;
  if (telephone !== undefined) invitedGuest.telephone = telephone;

  await invitedGuest.save();
  return ok(res, { invitedGuest });
});

const deleteInvitedGuest = asyncHandler(async (req, res) => {
  const invitedGuest = await InvitedGuest.findByIdAndDelete(req.params.id);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  return ok(res, { message: "Invité attendu supprimé." });
});

const exportGuestsCsv = asyncHandler(async (req, res) => {
  const guests = await User.find({ role: ROLES.GUEST });
  const reservations = await Reservation.find({ status: { $in: ACTIVE_STATUSES } }).populate("table", "name");
  const byGuest = new Map(reservations.map((r) => [r.guest.toString(), r]));

  const rows = guests.map((g) => {
    const r = byGuest.get(g._id.toString());
    return {
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      linkToCouple: g.linkToCouple,
      rsvpStatus: g.rsvpStatus,
      tableName: r ? r.table.name : "",
      seatNumber: r ? r.seatNumber : "",
      reservationStatus: r ? r.status : "Aucune réservation",
    };
  });

  const csv = exportService.guestsToCsv(rows);
  res.header("Content-Type", "text/csv");
  res.attachment("invites-jm-mariage.csv");
  return res.send(csv);
});

module.exports = {
  dashboard,
  listReservations,
  approveReservation,
  deleteReservation,
  createReservationManual,
  moveReservation,
  listGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  listInvitedGuests,
  createInvitedGuest,
  updateInvitedGuest,
  deleteInvitedGuest,
  exportGuestsCsv,
};
