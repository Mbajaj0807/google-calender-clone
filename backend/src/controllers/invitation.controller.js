const Invitation = require("../models/Invitation.model");

// POST /invitations  (manual send – usually auto-called from createEvent)
const sendInvitations = async (req, res) => {
  try {
    const { eventId, participantIds } = req.body;
    if (!eventId || !participantIds?.length)
      return res.status(400).json({ message: "eventId and participantIds required" });

    const invitations = participantIds.map((uid) => ({ eventId, userId: uid }));
    const created = await Invitation.insertMany(invitations, { ordered: false });
    res.status(201).json({ invitations: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /invitations/:id  – { status: "accepted"|"declined"|"tentative" }
const respondToInvitation = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["accepted", "declined", "tentative"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });

    const invitation = await Invitation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });

    invitation.status = status;
    invitation.respondedAt = new Date();
    await invitation.save();
    res.json({ invitation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /invitations  – pending invitations for the current user
const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ userId: req.user._id, status: "invited" })
      .populate({ path: "eventId", populate: { path: "organizerId", select: "name email" } });
    res.json({ invitations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendInvitations, respondToInvitation, getPendingInvitations };
