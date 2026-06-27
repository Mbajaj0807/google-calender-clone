const Event = require("../models/Event.model");
const { Goal, GoalProgress } = require("../models/Goal.model");

/**
 * Returns data for GET /dashboard/personal
 */
async function getPersonalDashboard(userId) {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

  // Next upcoming event
  const nextTask = await Event.findOne({
    $or: [{ organizerId: userId }, { participantIds: userId }],
    status: "scheduled",
    startTime: { $gte: now },
  }).sort({ startTime: 1 }).select("title startTime location eventType");

  // Active goals with weekly progress
  const goals = await Goal.find({ userId, active: true });
  const goalsWithProgress = await Promise.all(goals.map(async (g) => {
    const entries = await GoalProgress.find({ goalId: g._id, userId, date: { $gte: weekStart, $lt: weekEnd } });
    const achieved = entries.reduce((s, e) => s + (e.value || 1), 0);
    return { ...g.toObject(), weeklyAchieved: achieved };
  }));

  // Weekly event stats
  const weekEvents = await Event.find({
    $or: [{ organizerId: userId }, { participantIds: userId }],
    status: { $ne: "cancelled" },
    startTime: { $gte: weekStart, $lt: weekEnd },
  });

  const meetingMinutes = weekEvents
    .filter((e) => e.eventType === "meeting")
    .reduce((sum, e) => sum + (e.endTime - e.startTime) / 60000, 0);

  const insights = {
    totalEventsThisWeek: weekEvents.length,
    meetingHoursThisWeek: +(meetingMinutes / 60).toFixed(1),
  };

  return { nextTask, goals: goalsWithProgress, insights };
}

/**
 * Returns data for GET /dashboard/weekly-rewind
 */
async function getWeeklyRewind(userId) {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0,0,0,0);

  const events = await Event.find({
    $or: [{ organizerId: userId }, { participantIds: userId }],
    status: { $ne: "cancelled" },
    startTime: { $gte: weekStart, $lt: now },
  });

  const meetings = events.filter((e) => e.eventType === "meeting");
  const meetingHours = +(meetings.reduce((s, e) => s + (e.endTime - e.startTime) / 3600000, 0)).toFixed(1);

  const goals = await Goal.find({ userId, active: true });
  const goalSummaries = await Promise.all(goals.map(async (g) => {
    const done = await GoalProgress.countDocuments({ goalId: g._id, date: { $gte: weekStart, $lt: now }, completed: true });
    const pct = Math.round((done / g.target) * 100);
    return { title: g.title, target: g.target, achieved: done, percent: pct };
  }));

  const avgGoalCompletion = goalSummaries.length
    ? Math.round(goalSummaries.reduce((s, g) => s + g.percent, 0) / goalSummaries.length)
    : 0;

  return {
    period: { from: weekStart, to: now },
    meetingCount: meetings.length,
    meetingHours,
    goalSummaries,
    avgGoalCompletion,
    aiSummary: `You completed ${avgGoalCompletion}% of your goals and spent ${meetingHours} hours in meetings this week.`,
  };
}

module.exports = { getPersonalDashboard, getWeeklyRewind };
