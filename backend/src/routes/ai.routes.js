const router = require("express").Router();
const { chat, dailySummary, weeklyInsights, meetingSummary } = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.post("/chat", chat);
router.get("/daily-summary", dailySummary);
router.get("/weekly-insights", weeklyInsights);
router.post("/meeting-summary", meetingSummary);

module.exports = router;
