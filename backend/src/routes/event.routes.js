const router = require("express").Router();
const {
  createEvent, updateEvent, deleteEvent, getEvent,
  getCalendarEvents, searchEvents, getTodayEvents, getUpcomingEvents,
  checkConflict, findAvailability,
} = require("../controllers/event.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

// Specific routes BEFORE /:id to avoid param clash
router.get("/calendar", getCalendarEvents);
router.get("/search", searchEvents);
router.get("/today", getTodayEvents);
router.get("/upcoming", getUpcomingEvents);
router.post("/check-conflict", checkConflict);
router.post("/find-availability", findAvailability);

router.route("/").post(createEvent);
router.route("/:id").get(getEvent).put(updateEvent).delete(deleteEvent);

module.exports = router;
