const router = require("express").Router();
const weddingInfoController = require("../controllers/weddingInfo.controller");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { ROLES } = require("../config/constants");

router.get("/", weddingInfoController.getInfo);
router.put("/", requireAuth, requireRole(ROLES.ADMIN), weddingInfoController.updateInfo);

router.get("/program/pdf", weddingInfoController.exportProgramPdf);
router.post("/program", requireAuth, requireRole(ROLES.ADMIN), weddingInfoController.addProgramStep);
router.put("/program/:stepId", requireAuth, requireRole(ROLES.ADMIN), weddingInfoController.updateProgramStep);
router.delete("/program/:stepId", requireAuth, requireRole(ROLES.ADMIN), weddingInfoController.deleteProgramStep);

module.exports = router;
