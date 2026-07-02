const router = require("express").Router();
const reservationController = require("../controllers/reservation.controller");
const requireAuth = require("../middleware/auth.middleware");

router.use(requireAuth);
router.post("/", reservationController.create);
router.get("/me", reservationController.getMine);
router.delete("/me", reservationController.cancel);
router.put("/me/change", reservationController.change);
router.get("/me/ticket", reservationController.ticket);

module.exports = router;
