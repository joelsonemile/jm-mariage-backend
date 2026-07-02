const WeddingInfo = require("../models/WeddingInfo");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

const getInfo = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOne();
  return ok(res, { info });
});

const updateInfo = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return ok(res, { info });
});

module.exports = { getInfo, updateInfo };
