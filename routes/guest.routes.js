const router = require("express").Router();
const guestController = require("../controllers/guest.controller");
const requireAuth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.use(requireAuth);
router.put("/me", upload.single("profilePhoto"), guestController.updateProfile);
router.put("/me/rsvp", guestController.updateRsvp);

module.exports = router;
