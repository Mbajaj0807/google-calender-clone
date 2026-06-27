const router = require("express").Router();
const { updateProfile, getUser, getOrganizationMembers } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.put("/profile", updateProfile);
router.get("/organization", getOrganizationMembers);
router.get("/:id", getUser);

module.exports = router;
