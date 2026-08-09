const router = require("express").Router();
const reservationController = require("../controllers/reservation.controller");
const requireAuth = require("../middleware/auth.middleware");

router.use(requireAuth);
router.post("/", reservationController.create);
router.get("/me", reservationController.getMine);
router.delete("/:id", reservationController.cancel);
router.put("/:id/change", reservationController.change);
router.put("/:id/companion-name", reservationController.updateCompanionName);
router.get("/ticket", reservationController.myTicket);

module.exports = router;
