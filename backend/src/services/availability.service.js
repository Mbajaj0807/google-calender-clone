const Event = require("../models/Event.model");

/**
 * Returns free intervals of a single user within [windowStart, windowEnd].
 */
async function getFreeIntervals(userId, windowStart, windowEnd) {
  const busy = await Event.find({
    $or: [{ organizerId: userId }, { participantIds: userId }],
    status: { $ne: "cancelled" },
    startTime: { $lt: windowEnd },
    endTime: { $gt: windowStart },
  }).select("startTime endTime").sort({ startTime: 1 });

  const freeSlots = [];
  let cursor = windowStart;

  for (const event of busy) {
    const bStart = new Date(event.startTime);
    const bEnd = new Date(event.endTime);
    if (cursor < bStart) freeSlots.push({ start: new Date(cursor), end: new Date(bStart) });
    if (bEnd > cursor) cursor = bEnd;
  }

  if (cursor < windowEnd) freeSlots.push({ start: new Date(cursor), end: new Date(windowEnd) });
  return freeSlots;
}

/**
 * Intersect two sorted interval lists.
 */
function intersect(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    const start = new Date(Math.max(a[i].start, b[j].start));
    const end = new Date(Math.min(a[i].end, b[j].end));
    if (start < end) result.push({ start, end });
    if (a[i].end <= b[j].end) i++; else j++;
  }
  return result;
}

/**
 * Find common free slots for multiple participants.
 * @param {string[]} participantIds
 * @param {Date} windowStart
 * @param {Date} windowEnd
 * @param {number} durationMinutes
 * @returns {Array<{start: Date, end: Date}>}
 */
async function findCommonSlots(participantIds, windowStart, windowEnd, durationMinutes) {
  if (!participantIds.length) return [];

  // Initialise with the full window
  let candidates = [{ start: windowStart, end: windowEnd }];

  for (const uid of participantIds) {
    const free = await getFreeIntervals(uid, windowStart, windowEnd);
    candidates = intersect(candidates, free);
    if (!candidates.length) break;
  }

  const durationMs = durationMinutes * 60 * 1000;
  return candidates.filter((s) => s.end - s.start >= durationMs);
}

/**
 * Check if any participant has a conflict in the given time range.
 * Returns list of conflicting user IDs.
 */
async function checkConflicts(participantIds, startTime, endTime) {
  const conflictingUsers = [];
  for (const uid of participantIds) {
    const conflict = await Event.findOne({
      $or: [{ organizerId: uid }, { participantIds: uid }],
      status: { $ne: "cancelled" },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflict) conflictingUsers.push(uid);
  }
  return conflictingUsers;
}

module.exports = { findCommonSlots, checkConflicts, getFreeIntervals };
