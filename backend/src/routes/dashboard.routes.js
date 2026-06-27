const router = require("express").Router();
const { personal, weeklyRewind, goalAnalytics } = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/personal", personal);
router.get("/weekly-rewind", weeklyRewind);
router.get("/goals", goalAnalytics);

module.exports = router;
