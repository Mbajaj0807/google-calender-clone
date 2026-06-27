const router = require("express").Router();
const { createPoll, vote, getPoll, finalizePoll } = require("../controllers/poll.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.post("/", createPoll);
router.get("/:id", getPoll);
router.post("/:id/vote", vote);
router.post("/:id/finalize", finalizePoll);

module.exports = router;
