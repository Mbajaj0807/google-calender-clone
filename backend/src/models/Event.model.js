const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    agenda: { type: String, default: "" },
    notes: { type: String, default: "" },
    location: { type: String, default: "" },
    eventType: {
      type: String,
      enum: ["meeting", "personal", "goal", "holiday"],
      default: "personal",
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    visibility: {
      type: String,
      enum: ["private", "organization"],
      default: "private",
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    recurrenceRule: { type: String, default: null }, // iCal RRULE string
    color: { type: String, default: "#4285F4" },
    // Personal Commitment Protection
    protectedPersonal: { type: Boolean, default: false },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachmentUrls: [{ type: String }],
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

// Index for calendar range queries
eventSchema.index({ startTime: 1, endTime: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ participantIds: 1 });

module.exports = mongoose.model("Event", eventSchema);
