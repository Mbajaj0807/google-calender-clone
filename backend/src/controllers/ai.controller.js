const { generateAIResponse } = require("../services/ai.service");
const Event = require("../models/Event.model");
const { getWeeklyRewind } = require("../services/dashboard.service");

const CALENDAR_SYSTEM_PROMPT = `You are an intelligent calendar assistant. 
The user may ask to schedule meetings, check availability, move events, or get productivity insights. 
Reply concisely and helpfully. If you need to perform an action, describe what you would do.`;

// POST /ai/chat  – { message: string, context?: object }
const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    // Attach upcoming events as context for better responses
    const upcoming = await Event.find({
      $or: [{ organizerId: req.user._id }, { participantIds: req.user._id }],
      status: "scheduled",
      startTime: { $gte: new Date() },
    }).sort({ startTime: 1 }).limit(5).select("title startTime endTime eventType");

    const contextStr = `
User: ${req.user.name}
Upcoming events: ${JSON.stringify(upcoming)}
${context ? `Extra context: ${JSON.stringify(context)}` : ""}
`;

    const { text } = await generateAIResponse(CALENDAR_SYSTEM_PROMPT + contextStr, message);
    res.json({ reply: text });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /ai/daily-summary
const dailySummary = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const events = await Event.find({
      $or: [{ organizerId: req.user._id }, { participantIds: req.user._id }],
      status: { $ne: "cancelled" },
      startTime: { $gte: start, $lte: end },
    }).sort({ startTime: 1 }).select("title startTime endTime eventType priority");

    const prompt = `The user has ${events.length} events today: ${JSON.stringify(events)}. 
Give a short motivational daily summary with key highlights.`;

    const { text } = await generateAIResponse(CALENDAR_SYSTEM_PROMPT, prompt);
    res.json({ summary: text, events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /ai/weekly-insights
const weeklyInsights = async (req, res) => {
  try {
    const rewind = await getWeeklyRewind(req.user._id);
    const prompt = `Based on this weekly data: ${JSON.stringify(rewind)}, provide 3 actionable productivity insights.`;
    const { text } = await generateAIResponse(CALENDAR_SYSTEM_PROMPT, prompt);
    res.json({ insights: text, data: rewind });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /ai/meeting-summary  – { eventId: string }
const meetingSummary = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId)
      .populate("participantIds", "name")
      .populate("organizerId", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const prompt = `Generate a concise meeting summary for: ${JSON.stringify({
      title: event.title,
      agenda: event.agenda,
      notes: event.notes,
      participants: event.participantIds.map((p) => p.name),
    })}`;

    const { text } = await generateAIResponse(CALENDAR_SYSTEM_PROMPT, prompt);
    res.json({ summary: text });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { chat, dailySummary, weeklyInsights, meetingSummary };
