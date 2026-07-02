const router = require("express").Router();
const tableController = require("../controllers/table.controller");
const requireAuth = require("../middleware/auth.middleware");

router.use(requireAuth);
router.get("/", tableController.listTables);
router.get("/:id", tableController.getTable);

module.exports = router;
