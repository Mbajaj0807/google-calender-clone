const router = require("express").Router();
const { createGoal, updateGoal, deleteGoal, getGoals, logProgress, getProgress } = require("../controllers/goal.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.route("/").get(getGoals).post(createGoal);
router.route("/:id").put(updateGoal).delete(deleteGoal);
router.post("/:id/progress", logProgress);
router.get("/:id/progress", getProgress);

module.exports = router;
