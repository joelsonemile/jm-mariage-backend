const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { ROLES } = require("../config/constants");

// Toutes les routes ci-dessous exigent un compte authentifié avec le rôle admin.
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/dashboard", adminController.dashboard);

router.get("/reservations", adminController.listReservations);
router.post("/reservations", adminController.createReservationManual);
router.put("/reservations/:id/approve", adminController.approveReservation);
router.put("/reservations/:id/move", adminController.moveReservation);
router.delete("/reservations/:id", adminController.deleteReservation);

router.get("/guests", adminController.listGuests);
router.post("/guests", adminController.createGuest);
router.put("/guests/:id", adminController.updateGuest);
router.delete("/guests/:id", adminController.deleteGuest);

router.get("/export/csv", adminController.exportGuestsCsv);

module.exports = router;
