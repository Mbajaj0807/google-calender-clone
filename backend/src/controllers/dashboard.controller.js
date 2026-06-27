const { getPersonalDashboard, getWeeklyRewind } = require("../services/dashboard.service");
const { Goal, GoalProgress } = require("../models/Goal.model");

// GET /dashboard/personal
const personal = async (req, res) => {
  try {
    const data = await getPersonalDashboard(req.user._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /dashboard/weekly-rewind
const weeklyRewind = async (req, res) => {
  try {
    const data = await getWeeklyRewind(req.user._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /dashboard/goals
const goalAnalytics = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const analytics = await Promise.all(goals.map(async (g) => {
      const monthly = await GoalProgress.find({ goalId: g._id, date: { $gte: monthStart } });
      return {
        goal: g,
        monthlyEntries: monthly.length,
        monthlyValue: monthly.reduce((s, e) => s + (e.value || 1), 0),
      };
    }));

    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { personal, weeklyRewind, goalAnalytics };
