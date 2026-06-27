const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["invited", "accepted", "declined", "tentative"],
      default: "invited",
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

invitationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Invitation", invitationSchema);
