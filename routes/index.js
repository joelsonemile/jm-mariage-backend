const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/guests", require("./guest.routes"));
router.use("/tables", require("./table.routes"));
router.use("/reservations", require("./reservation.routes"));
router.use("/wedding-info", require("./weddingInfo.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
