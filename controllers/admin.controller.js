const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const InvitedGuest = require("../models/InvitedGuest");
const Category = require("../models/Category");
const CommitteeMember = require("../models/CommitteeMember");
const Commission = require("../models/Commission");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { ROLES, RESERVATION_STATUS } = require("../config/constants");
const { emitSeatUpdated } = require("../sockets");
const emailService = require("../services/email.service");
const exportService = require("../services/export.service");
const pdfService = require("../services/pdf.service");

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
  const { guestId, tableId, seatNumber, status, companionName } = req.body;
  if (!guestId || !tableId || !seatNumber) throw new ApiError(400, "Invité, table et place requis.");

  let reservation;
  try {
    reservation = await Reservation.create({
      guest: guestId,
      table: tableId,
      seatNumber,
      companionName: (companionName || "").trim(),
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

// Affecte manuellement un invité de la liste "invités attendus" (sans compte,
// typiquement une personne âgée qui ne sait pas utiliser l'application) à une
// place — provisionne un compte User minimal la première fois, puis le réutilise.
const assignInvitedGuestToSeat = asyncHandler(async (req, res) => {
  const { invitedGuestId, tableId, seatNumber } = req.body;
  if (!invitedGuestId || !tableId || !seatNumber) throw new ApiError(400, "Invité, table et place requis.");

  const invitedGuest = await InvitedGuest.findById(invitedGuestId);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  let userId = invitedGuest.linkedUserId;
  if (!userId || !(await User.exists({ _id: userId }))) {
    const fullName = `${invitedGuest.prenom} ${invitedGuest.nom}`.trim() || "Invité";
    const temporaryPassword = crypto.randomBytes(12).toString("hex");
    const hashed = await bcrypt.hash(temporaryPassword, 10);
    const user = await User.create({
      fullName,
      email: `invite-${invitedGuest._id}@jm-mariage.local`,
      phone: invitedGuest.telephone || "N/A",
      password: hashed,
      role: ROLES.GUEST,
    });
    userId = user._id;
    invitedGuest.linkedUserId = userId;
    await invitedGuest.save();
  }

  // Un même invité attendu ne peut pas occuper 2 places à la fois — s'il en a
  // déjà une, il faut la déplacer (bouton "Déplacer") plutôt qu'en créer une autre.
  const existing = await Reservation.findOne({
    guest: userId,
    status: { $in: ACTIVE_STATUSES },
  }).populate("table", "name");
  if (existing) {
    throw new ApiError(
      409,
      `${invitedGuest.prenom} ${invitedGuest.nom} occupe déjà la place #${existing.seatNumber} à la table ${existing.table.name}. Utilisez "Déplacer" pour la changer.`
    );
  }

  let reservation;
  try {
    reservation = await Reservation.create({
      guest: userId,
      table: tableId,
      seatNumber,
      status: RESERVATION_STATUS.VALIDATED,
      validatedAt: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Cette place est déjà occupée.");
    throw err;
  }

  emitSeatUpdated(tableId);
  await reservation.populate("guest", "fullName phone email linkToCouple");
  await reservation.populate("table", "name");
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
  const byGuest = new Map();
  for (const r of reservations) {
    const key = r.guest.toString();
    if (!byGuest.has(key)) byGuest.set(key, []);
    byGuest.get(key).push(r);
  }

  const result = guests.map((g) => {
    const guestReservations = byGuest.get(g._id.toString()) || [];
    return {
      id: g._id,
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      linkToCouple: g.linkToCouple,
      rsvpStatus: g.rsvpStatus,
      groupSize: g.groupSize,
      reservations: guestReservations.map((r) => ({
        id: r._id,
        tableName: r.table.name,
        seatNumber: r.seatNumber,
        status: r.status,
        companionName: r.companionName || "",
      })),
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

  const activeReservations = await Reservation.find({
    guest: guest._id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (activeReservations.length) {
    await Reservation.deleteMany({ _id: { $in: activeReservations.map((r) => r._id) } });
    const tableIds = new Set(activeReservations.map((r) => r.table.toString()));
    for (const tableId of tableIds) emitSeatUpdated(tableId);
  }

  return ok(res, { message: "Invité supprimé." });
});

const listInvitedGuests = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const categorie = req.query.categorie || "";

  const filter = {
    ...(categorie ? { categorie } : {}),
    ...(search
      ? {
          $or: [
            { nom: new RegExp(search, "i") },
            { prenom: new RegExp(search, "i") },
            { telephone: new RegExp(search, "i") },
          ],
        }
      : {}),
  };

  const invitedGuests = await InvitedGuest.find(filter).sort({ categorie: 1, nom: 1, prenom: 1 });
  return ok(res, { invitedGuests });
});

const createInvitedGuest = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, categorie, nombreAccompagnants } = req.body;
  if (!nom && !prenom) throw new ApiError(400, "Nom ou prénom requis.");

  const invitedGuest = await InvitedGuest.create({
    nom: nom || "",
    prenom: prenom || "",
    telephone: telephone || "",
    categorie: categorie || "Autres",
    nombreAccompagnants: Number(nombreAccompagnants) || 0,
  });

  return ok(res, { invitedGuest }, 201);
});

const updateInvitedGuest = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, categorie, nombreAccompagnants } = req.body;
  const invitedGuest = await InvitedGuest.findById(req.params.id);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  if (nom !== undefined) invitedGuest.nom = nom;
  if (prenom !== undefined) invitedGuest.prenom = prenom;
  if (telephone !== undefined) invitedGuest.telephone = telephone;
  if (categorie !== undefined) invitedGuest.categorie = categorie;
  if (nombreAccompagnants !== undefined) invitedGuest.nombreAccompagnants = Number(nombreAccompagnants) || 0;

  await invitedGuest.save();
  return ok(res, { invitedGuest });
});

const deleteInvitedGuest = asyncHandler(async (req, res) => {
  const invitedGuest = await InvitedGuest.findByIdAndDelete(req.params.id);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  return ok(res, { message: "Invité attendu supprimé." });
});

const markInvitationSent = asyncHandler(async (req, res) => {
  const invitedGuest = await InvitedGuest.findById(req.params.id);
  if (!invitedGuest) throw new ApiError(404, "Invité attendu introuvable.");

  invitedGuest.invitationSentAt = req.body.sent === false ? null : new Date();
  await invitedGuest.save();
  return ok(res, { invitedGuest });
});

const exportInvitedGuestsPdf = asyncHandler(async (req, res) => {
  const invitedGuests = await InvitedGuest.find().sort({ categorie: 1, nom: 1, prenom: 1 });
  const buffer = await pdfService.buildInvitedGuestsPdf(invitedGuests);
  res.header("Content-Type", "application/pdf");
  res.attachment("invites-attendus-jm-mariage.pdf");
  return res.send(buffer);
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ nom: 1 });
  return ok(res, { categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { nom } = req.body;
  if (!nom) throw new ApiError(400, "Nom de catégorie requis.");

  const existing = await Category.findOne({ nom: new RegExp(`^${nom}$`, "i") });
  if (existing) throw new ApiError(409, "Cette catégorie existe déjà.");

  const category = await Category.create({ nom });
  return ok(res, { category }, 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { nom } = req.body;
  if (!nom) throw new ApiError(400, "Nom de catégorie requis.");

  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catégorie introuvable.");

  const existing = await Category.findOne({ _id: { $ne: category._id }, nom: new RegExp(`^${nom}$`, "i") });
  if (existing) throw new ApiError(409, "Cette catégorie existe déjà.");

  const previousName = category.nom;
  category.nom = nom;
  await category.save();

  if (previousName !== nom) {
    await InvitedGuest.updateMany({ categorie: previousName }, { categorie: nom });
  }

  return ok(res, { category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Catégorie introuvable.");

  const usageCount = await InvitedGuest.countDocuments({ categorie: category.nom });
  if (usageCount > 0) {
    throw new ApiError(409, `${usageCount} invité(s) attendu(s) utilisent cette catégorie. Réassignez-les avant de la supprimer.`);
  }

  await category.deleteOne();
  return ok(res, { message: "Catégorie supprimée." });
});

const exportGuestsCsv = asyncHandler(async (req, res) => {
  const guests = await User.find({ role: ROLES.GUEST });
  const reservations = await Reservation.find({ status: { $in: ACTIVE_STATUSES } }).populate("table", "name");
  const byGuest = new Map();
  for (const r of reservations) {
    const key = r.guest.toString();
    if (!byGuest.has(key)) byGuest.set(key, []);
    byGuest.get(key).push(r);
  }

  // Une ligne par réservation (un invité peut désormais en avoir plusieurs) ;
  // les invités sans réservation gardent une seule ligne avec les champs vides.
  const rows = guests.flatMap((g) => {
    const guestReservations = byGuest.get(g._id.toString()) || [];
    const base = {
      fullName: g.fullName,
      email: g.email,
      phone: g.phone,
      linkToCouple: g.linkToCouple,
      rsvpStatus: g.rsvpStatus,
    };

    if (!guestReservations.length) {
      return [{ ...base, tableName: "", seatNumber: "", reservationStatus: "Aucune réservation", companionName: "" }];
    }

    return guestReservations.map((r) => ({
      ...base,
      tableName: r.table.name,
      seatNumber: r.seatNumber,
      reservationStatus: r.status,
      companionName: r.companionName || "",
    }));
  });

  const csv = exportService.guestsToCsv(rows);
  res.header("Content-Type", "text/csv");
  res.attachment("invites-jm-mariage.csv");
  return res.send(csv);
});

const listCommitteeMembers = asyncHandler(async (req, res) => {
  const commission = req.query.commission || "";
  const filter = commission ? { commission } : {};

  const committeeMembers = await CommitteeMember.find(filter).sort({ commission: 1, ordre: 1, nom: 1 });
  return ok(res, { committeeMembers });
});

const createCommitteeMember = asyncHandler(async (req, res) => {
  const { nom, role, description, commission } = req.body;
  if (!nom) throw new ApiError(400, "Nom requis.");

  const committeeMember = await CommitteeMember.create({
    nom,
    role: role || "",
    description: description || "",
    commission: commission || "",
  });

  return ok(res, { committeeMember }, 201);
});

const updateCommitteeMember = asyncHandler(async (req, res) => {
  const { nom, role, description, commission } = req.body;
  const committeeMember = await CommitteeMember.findById(req.params.id);
  if (!committeeMember) throw new ApiError(404, "Membre du comité introuvable.");

  const previousCommission = committeeMember.commission;

  if (nom !== undefined) committeeMember.nom = nom;
  if (role !== undefined) committeeMember.role = role;
  if (description !== undefined) committeeMember.description = description;
  if (commission !== undefined) committeeMember.commission = commission;

  await committeeMember.save();

  // Si ce membre quitte la commission dont il était (co-)responsable, on retire
  // la désignation plutôt que de laisser une référence invalide.
  if (commission !== undefined && previousCommission && previousCommission !== commission) {
    await Commission.updateOne(
      { nom: previousCommission },
      { $pull: { responsables: committeeMember._id } }
    );
  }

  return ok(res, { committeeMember });
});

const deleteCommitteeMember = asyncHandler(async (req, res) => {
  const committeeMember = await CommitteeMember.findByIdAndDelete(req.params.id);
  if (!committeeMember) throw new ApiError(404, "Membre du comité introuvable.");

  await Commission.updateMany({}, { $pull: { responsables: committeeMember._id } });

  return ok(res, { message: "Membre du comité supprimé." });
});

const listCommissions = asyncHandler(async (req, res) => {
  const commissions = await Commission.find().sort({ nom: 1 }).populate("responsables", "nom role");
  return ok(res, { commissions });
});

const createCommission = asyncHandler(async (req, res) => {
  const { nom } = req.body;
  if (!nom) throw new ApiError(400, "Nom de commission requis.");

  const existing = await Commission.findOne({ nom: new RegExp(`^${nom}$`, "i") });
  if (existing) throw new ApiError(409, "Cette commission existe déjà.");

  const commission = await Commission.create({ nom });
  return ok(res, { commission }, 201);
});

const updateCommission = asyncHandler(async (req, res) => {
  const { nom } = req.body;
  const commission = await Commission.findById(req.params.id);
  if (!commission) throw new ApiError(404, "Commission introuvable.");

  if (nom !== undefined) {
    if (!nom) throw new ApiError(400, "Nom de commission requis.");
    const existing = await Commission.findOne({ _id: { $ne: commission._id }, nom: new RegExp(`^${nom}$`, "i") });
    if (existing) throw new ApiError(409, "Cette commission existe déjà.");

    const previousName = commission.nom;
    commission.nom = nom;
    if (previousName !== nom) {
      await CommitteeMember.updateMany({ commission: previousName }, { commission: nom });
    }
  }

  await commission.save();
  await commission.populate("responsables", "nom role");
  return ok(res, { commission });
});

// Remplace la liste des (co-)responsables d'une commission — le "comité" de
// cette commission au sens du cahier des charges. Accepte 0, 1 ou plusieurs
// membres (ex: Samuel ET Johnathan pour Accueil & Logistique).
const setCommissionResponsables = asyncHandler(async (req, res) => {
  const { committeeMemberIds } = req.body;
  const commission = await Commission.findById(req.params.id);
  if (!commission) throw new ApiError(404, "Commission introuvable.");

  const ids = Array.isArray(committeeMemberIds) ? [...new Set(committeeMemberIds)] : [];
  if (ids.length) {
    const members = await CommitteeMember.find({ _id: { $in: ids } });
    if (members.length !== ids.length) throw new ApiError(404, "Membre introuvable.");
    const invalid = members.find((m) => m.commission !== commission.nom);
    if (invalid) throw new ApiError(400, `${invalid.nom} ne fait pas partie de la commission ${commission.nom}.`);
  }

  commission.responsables = ids;
  await commission.save();
  await commission.populate("responsables", "nom role");
  return ok(res, { commission });
});

const deleteCommission = asyncHandler(async (req, res) => {
  const commission = await Commission.findById(req.params.id);
  if (!commission) throw new ApiError(404, "Commission introuvable.");

  const usageCount = await CommitteeMember.countDocuments({ commission: commission.nom });
  if (usageCount > 0) {
    throw new ApiError(409, `${usageCount} membre(s) du comité utilisent cette commission. Réassignez-les avant de la supprimer.`);
  }

  await commission.deleteOne();
  return ok(res, { message: "Commission supprimée." });
});

const exportTablesPdf = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ order: 1 });
  const reservations = await Reservation.find({ status: { $in: ACTIVE_STATUSES } }).populate("guest", "fullName");

  const byTable = new Map();
  for (const r of reservations) {
    const key = r.table.toString();
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key).push(r);
  }

  const buffer = await pdfService.buildTablesPdf(
    tables.map((t) => ({
      id: t._id,
      name: t.name,
      totalSeats: t.totalSeats,
      adminOnly: t.adminOnly,
    })),
    byTable
  );
  res.header("Content-Type", "application/pdf");
  res.attachment("plan-tables-jm-mariage.pdf");
  return res.send(buffer);
});

const exportCommitteePdf = asyncHandler(async (req, res) => {
  const [commissions, members] = await Promise.all([
    Commission.find().sort({ nom: 1 }).populate("responsables", "nom role"),
    CommitteeMember.find().sort({ commission: 1, ordre: 1, nom: 1 }),
  ]);
  const buffer = await pdfService.buildCommitteePdf(commissions, members);
  res.header("Content-Type", "application/pdf");
  res.attachment("comite-organisation-jm-mariage.pdf");
  return res.send(buffer);
});

module.exports = {
  dashboard,
  listReservations,
  approveReservation,
  deleteReservation,
  createReservationManual,
  exportTablesPdf,
  assignInvitedGuestToSeat,
  moveReservation,
  listGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  listInvitedGuests,
  createInvitedGuest,
  updateInvitedGuest,
  deleteInvitedGuest,
  markInvitationSent,
  exportInvitedGuestsPdf,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listCommitteeMembers,
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
  listCommissions,
  createCommission,
  updateCommission,
  setCommissionResponsables,
  deleteCommission,
  exportCommitteePdf,
  exportGuestsCsv,
};
