const Event = require("../models/Event.model");
const Invitation = require("../models/Invitation.model");
const { checkConflicts, findCommonSlots } = require("../services/availability.service");

// POST /events
const createEvent = async (req, res) => {
  try {
    const {
      title, description, agenda, notes, location,
      eventType, priority, visibility,
      startTime, endTime, recurrenceRule, color,
      protectedPersonal, organizationId,
      participantIds = [], attachmentUrls = [],
    } = req.body;

    const event = await Event.create({
      title, description, agenda, notes, location,
      eventType, priority, visibility,
      startTime, endTime, recurrenceRule, color,
      protectedPersonal: protectedPersonal || false,
      organizerId: req.user._id,
      organizationId,
      participantIds,
      attachmentUrls,
    });

    // Auto-create invitations for all participants
    if (participantIds.length) {
      const invitations = participantIds.map((uid) => ({ eventId: event._id, userId: uid }));
      await Invitation.insertMany(invitations);
    }

    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.organizerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organiser can update" });

    const updatable = [
      "title", "description", "agenda", "notes", "location",
      "eventType", "priority", "visibility",
      "startTime", "endTime", "recurrenceRule", "color",
      "protectedPersonal", "participantIds", "attachmentUrls", "status",
    ];
    updatable.forEach((f) => { if (req.body[f] !== undefined) event[f] = req.body[f]; });
    await event.save();
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.organizerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organiser can delete" });

    await event.deleteOne();
    await Invitation.deleteMany({ eventId: event._id });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /events/:id
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizerId", "name email profilePicture")
      .populate("participantIds", "name email profilePicture dateOfBirth");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /events/calendar?start=&end=
const getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: "start and end query params required" });

    const userId = req.user._id;
    const events = await Event.find({
      $or: [{ organizerId: userId }, { participantIds: userId }],
      status: { $ne: "cancelled" },
      startTime: { $lt: new Date(end) },
      endTime: { $gt: new Date(start) },
    }).populate("organizerId", "name email").populate("participantIds", "name email profilePicture dateOfBirth");

    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /events/search?q=
const searchEvents = async (req, res) => {
  try {
    const q = req.query.q || "";
    const userId = req.user._id;
    const events = await Event.find({
      $or: [{ organizerId: userId }, { participantIds: userId }],
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).limit(50);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /events/today
const getTodayEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const events = await Event.find({
      $or: [{ organizerId: userId }, { participantIds: userId }],
      status: { $ne: "cancelled" },
      startTime: { $gte: start, $lte: end },
    }).sort({ startTime: 1 });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /events/upcoming
const getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const events = await Event.find({
      $or: [{ organizerId: userId }, { participantIds: userId }],
      status: "scheduled",
      startTime: { $gte: new Date() },
    }).sort({ startTime: 1 }).limit(10);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /events/check-conflict
const checkConflict = async (req, res) => {
  try {
    const { participants, startTime, endTime } = req.body;
    if (!participants || !startTime || !endTime)
      return res.status(400).json({ message: "participants, startTime, endTime required" });

    const conflicts = await checkConflicts(participants, new Date(startTime), new Date(endTime));
    res.json({ conflicts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /events/find-availability
const findAvailability = async (req, res) => {
  try {
    const { participants, windowStart, windowEnd, duration } = req.body;
    if (!participants || !windowStart || !windowEnd || !duration)
      return res.status(400).json({ message: "participants, windowStart, windowEnd, duration required" });

    const slots = await findCommonSlots(
      participants,
      new Date(windowStart),
      new Date(windowEnd),
      duration
    );
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createEvent, updateEvent, deleteEvent, getEvent,
  getCalendarEvents, searchEvents, getTodayEvents, getUpcomingEvents,
  checkConflict, findAvailability,
};
