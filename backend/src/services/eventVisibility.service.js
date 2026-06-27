const Invitation = require("../models/Invitation.model");

/**
 * Builds the Mongo filter clause for "events this user should see on
 * their calendar": events they organize, OR events they're invited to
 * AND have responded "accepted" or "tentative" to.
 *
 * Deliberately excludes events where the user's invitation is still
 * "invited" (pending) or "declined" — those should only surface via
 * the Invitations API/notifications, not appear pre-emptively on the
 * calendar as if the user had already agreed to attend.
 *
 * NOTE: this only affects calendar *visibility* queries (getCalendarEvents,
 * getTodayEvents, getUpcomingEvents). It intentionally does NOT change
 * conflict-checking or availability-finding (availability.service.js),
 * where a pending invitation should still count as a soft "busy" hold —
 * that's a different concern from what renders on someone's calendar.
 */
async function buildVisibleEventsFilter(userId) {
  const respondedInvitations = await Invitation.find({
    userId,
    status: { $in: ["accepted", "tentative"] },
  }).select("eventId");

  const visibleEventIds = respondedInvitations.map((inv) => inv.eventId);

  return {
    $or: [
      { organizerId: userId },
      { _id: { $in: visibleEventIds } },
    ],
  };
}

module.exports = { buildVisibleEventsFilter };