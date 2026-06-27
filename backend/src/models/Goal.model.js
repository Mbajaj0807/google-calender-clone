const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "general" },
    frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
    target: { type: Number, required: true },
    unit: { type: String, default: "sessions" },
    color: { type: String, default: "#34A853" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const goalProgressSchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    value: { type: Number, default: 1 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

goalProgressSchema.index({ goalId: 1, date: -1 });

const Goal = mongoose.model("Goal", goalSchema);
const GoalProgress = mongoose.model("GoalProgress", goalProgressSchema);

module.exports = { Goal, GoalProgress };
