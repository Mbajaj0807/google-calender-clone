const MeetingPoll = require("../models/MeetingPoll.model");
const Event = require("../models/Event.model");
const Invitation = require("../models/Invitation.model");
const { checkConflicts } = require("../services/availability.service");

// POST /polls
const createPoll = async (req, res) => {
  try {
    const { title, agenda, duration, participantIds, organizationId, options } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    if (!duration || duration <= 0) return res.status(400).json({ message: "duration (minutes) is required" });
    if (!options || options.length < 2 || options.length > 4)
      return res.status(400).json({ message: "Provide 2–4 time options" });

    for (const opt of options) {
      if (!opt.startTime || !opt.endTime) {
        return res.status(400).json({ message: "Each option needs a startTime and endTime" });
      }
      if (new Date(opt.endTime) <= new Date(opt.startTime)) {
        return res.status(400).json({ message: "Each option's endTime must be after its startTime" });
      }
    }

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

    const userId = req.user._id.toString();
    const isOrganizer = poll.organizerId.toString() === userId;
    const isParticipant = poll.participantIds.some((p) => p.toString() === userId);
    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ message: "Only invited participants can vote on this poll" });
    }

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

// GET /polls  – polls where I'm the organizer or an invited participant
const getMyPolls = async (req, res) => {
  try {
    const userId = req.user._id;
    const polls = await MeetingPoll.find({
      $or: [{ organizerId: userId }, { participantIds: userId }],
    })
      .populate("organizerId", "name email")
      .populate("participantIds", "name email")
      .sort({ createdAt: -1 });

    // Attach a small per-user convenience flag: have I voted yet, and on which option.
    const pollsWithMyVote = polls.map((poll) => {
      const obj = poll.toObject();
      const myOption = poll.options.find((opt) =>
        opt.votes.some((v) => v.toString() === userId.toString())
      );
      return { ...obj, myVoteOptionId: myOption ? myOption._id : null };
    });

    res.json({ polls: pollsWithMyVote });
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

    const userId = req.user._id.toString();
    const isOrganizer = poll.organizerId._id.toString() === userId;
    const isParticipant = poll.participantIds.some((p) => p._id.toString() === userId);
    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ message: "You don't have access to this poll" });
    }

    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /polls/:id/finalize
// Body (optional): { optionId } — required when votes are tied; lets the
// organizer manually choose. If omitted and there's a single clear leader,
// that option is picked automatically (preserves the simple, common case).
const finalizePoll = async (req, res) => {
  try {
    const poll = await MeetingPoll.findById(req.params.id);
    if (!poll || poll.status !== "active") return res.status(404).json({ message: "Poll not found or already closed" });
    if (poll.organizerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organiser can finalise" });

    const { optionId } = req.body;
    let winner;

    if (optionId) {
      // Organizer explicitly chose — always honour it (covers both the
      // tie-break case and "override the leader" case).
      winner = poll.options.id(optionId);
      if (!winner) return res.status(404).json({ message: "Option not found" });
    } else {
      const maxVotes = Math.max(...poll.options.map((o) => o.votes.length));
      const leaders = poll.options.filter((o) => o.votes.length === maxVotes);

      if (leaders.length > 1) {
        // Tie — don't guess. Ask the organizer to pick, showing vote counts.
        return res.status(409).json({
          message: "Multiple options are tied for the most votes. Choose one to finalize.",
          tie: true,
          options: poll.options.map((o) => ({
            _id: o._id,
            startTime: o.startTime,
            endTime: o.endTime,
            voteCount: o.votes.length,
          })),
        });
      }
      winner = leaders[0];
    }

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

    // Informational only — conflicts never block finalization, the
    // organizer just gets a heads-up about who may already be busy.
    const conflicts = poll.participantIds.length
      ? await checkConflicts(poll.participantIds, winner.startTime, winner.endTime)
      : [];

    res.json({ poll, event, conflicts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /polls/:id/cancel — organizer closes the poll without creating an event
const cancelPoll = async (req, res) => {
  try {
    const poll = await MeetingPoll.findById(req.params.id);
    if (!poll || poll.status !== "active") return res.status(404).json({ message: "Poll not found or already closed" });
    if (poll.organizerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organiser can cancel" });

    poll.status = "cancelled";
    await poll.save();
    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPoll, vote, getMyPolls, getPoll, finalizePoll, cancelPoll };