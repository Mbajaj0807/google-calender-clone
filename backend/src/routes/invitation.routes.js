const router = require("express").Router();
const { sendInvitations, respondToInvitation, getPendingInvitations } = require("../controllers/invitation.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", getPendingInvitations);
router.post("/", sendInvitations);
router.patch("/:id", respondToInvitation);

module.exports = router;
