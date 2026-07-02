const router = require("express").Router();
const weddingInfoController = require("../controllers/weddingInfo.controller");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { ROLES } = require("../config/constants");

router.get("/", weddingInfoController.getInfo);
router.put("/", requireAuth, requireRole(ROLES.ADMIN), weddingInfoController.updateInfo);

module.exports = router;
