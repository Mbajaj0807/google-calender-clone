const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: true }
);

const meetingPollSchema = new mongoose.Schema(
  {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    title: { type: String, required: true },
    agenda: { type: String, default: "" },
    duration: { type: Number, required: true }, // minutes
    options: { type: [pollOptionSchema], validate: (v) => v.length <= 4 },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    winningOption: { type: mongoose.Schema.Types.ObjectId },
    resultingEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MeetingPoll", meetingPollSchema);
