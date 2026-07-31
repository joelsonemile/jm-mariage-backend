const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const { RSVP_STATUS } = require("../config/constants");
const { toPublicUser } = require("./auth.controller");

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, linkToCouple } = req.body;

  if (fullName) req.user.fullName = fullName;
  if (phone) req.user.phone = phone;
  if (linkToCouple) req.user.linkToCouple = linkToCouple;
  if (req.file) req.user.profilePhoto = `/uploads/profiles/${req.file.filename}`;

  await req.user.save();
  return ok(res, { user: toPublicUser(req.user) });
});

const updateRsvp = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (![RSVP_STATUS.YES, RSVP_STATUS.NO].includes(status)) {
    throw new ApiError(400, "Statut RSVP invalide.");
  }

  req.user.rsvpStatus = status;
  await req.user.save();
  return ok(res, { user: toPublicUser(req.user) });
});

const updateGroupSize = asyncHandler(async (req, res) => {
  const groupSize = Number(req.body.groupSize);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
    throw new ApiError(400, "Le nombre d'invités doit être un entier entre 1 et 20.");
  }

  req.user.groupSize = groupSize;
  await req.user.save();
  return ok(res, { user: toPublicUser(req.user) });
});

module.exports = { updateProfile, updateRsvp, updateGroupSize };
