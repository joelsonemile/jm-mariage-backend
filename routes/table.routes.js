const router = require("express").Router();
const tableController = require("../controllers/table.controller");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { ROLES } = require("../config/constants");

// Réservations clôturées : le plan de salle (et la réservation de place qui va
// avec) n'est plus accessible qu'à l'admin, qui gère désormais tous les
// placements manuellement depuis /admin/tables.
router.use(requireAuth, requireRole(ROLES.ADMIN));
router.get("/", tableController.listTables);
router.get("/:id", tableController.getTable);

module.exports = router;
