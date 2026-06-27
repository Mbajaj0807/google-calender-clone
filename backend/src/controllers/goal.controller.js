const { Goal, GoalProgress } = require("../models/Goal.model");

// POST /goals
const createGoal = async (req, res) => {
  try {
    const { title, category, frequency, target, unit, color } = req.body;
    const goal = await Goal.create({ userId: req.user._id, title, category, frequency, target, unit, color });
    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /goals/:id
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /goals/:id
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    await GoalProgress.deleteMany({ goalId: goal._id });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /goals
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id, active: true });
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /goals/:id/progress
const logProgress = async (req, res) => {
  try {
    const { date, value, notes } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const progress = await GoalProgress.create({
      goalId: goal._id,
      userId: req.user._id,
      date: new Date(date),
      value: value || 1,
      completed: true,
      notes,
    });
    res.status(201).json({ progress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /goals/:id/progress
const getProgress = async (req, res) => {
  try {
    const history = await GoalProgress.find({ goalId: req.params.id, userId: req.user._id })
      .sort({ date: -1 }).limit(90);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createGoal, updateGoal, deleteGoal, getGoals, logProgress, getProgress };
