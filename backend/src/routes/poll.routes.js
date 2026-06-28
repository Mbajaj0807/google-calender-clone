const router = require("express").Router();
const { createPoll, vote, getMyPolls, getPoll, finalizePoll, cancelPoll } = require("../controllers/poll.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.post("/", createPoll);
router.get("/", getMyPolls);
router.get("/:id", getPoll);
router.post("/:id/vote", vote);
router.post("/:id/finalize", finalizePoll);
router.post("/:id/cancel", cancelPoll);

module.exports = router;