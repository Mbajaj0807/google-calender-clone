const MeetingPoll = require("../models/MeetingPoll.model");
const Event = require("../models/Event.model");
const Invitation = require("../models/Invitation.model");

// POST /polls
const createPoll = async (req, res) => {
  try {
    const { title, agenda, duration, participantIds, organizationId, options } = req.body;
    if (!options || options.length < 2 || options.length > 4)
      return res.status(400).json({ message: "Provide 2–4 time options" });

    const poll = await MeetingPoll.create({
      organizerId: req.user._id,
      organizationId,
      participantIds,
      title,
      agenda,
      duration,
      options,
    });
    res.status(201).json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /polls/:id/vote
const vote = async (req, res) => {
  try {
    const { optionId } = req.body;
    const poll = await MeetingPoll.findById(req.params.id);
    if (!poll || poll.status !== "active") return res.status(404).json({ message: "Poll not found or closed" });

    const option = poll.options.id(optionId);
    if (!option) return res.status(404).json({ message: "Option not found" });

    // Remove user's previous vote from all options
    poll.options.forEach((o) => {
      o.votes = o.votes.filter((v) => v.toString() !== req.user._id.toString());
    });
    option.votes.push(req.user._id);
    await poll.save();
    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /polls/:id
const getPoll = async (req, res) => {
  try {
    const poll = await MeetingPoll.findById(req.params.id)
      .populate("organizerId", "name email")
      .populate("participantIds", "name email");
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /polls/:id/finalize  – picks winning option and creates event
const finalizePoll = async (req, res) => {
  try {
    const poll = await MeetingPoll.findById(req.params.id);
    if (!poll || poll.status !== "active") return res.status(404).json({ message: "Poll not found or already closed" });
    if (poll.organizerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organiser can finalise" });

    // Pick option with most votes
    const winner = poll.options.reduce((best, opt) =>
      opt.votes.length > best.votes.length ? opt : best
    );

    const event = await Event.create({
      title: poll.title,
      agenda: poll.agenda,
      eventType: "meeting",
      startTime: winner.startTime,
      endTime: winner.endTime,
      organizerId: poll.organizerId,
      organizationId: poll.organizationId,
      participantIds: poll.participantIds,
    });

    if (poll.participantIds.length) {
      await Invitation.insertMany(poll.participantIds.map((uid) => ({ eventId: event._id, userId: uid })));
    }

    poll.status = "completed";
    poll.winningOption = winner._id;
    poll.resultingEventId = event._id;
    await poll.save();

    res.json({ poll, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPoll, vote, getPoll, finalizePoll };
