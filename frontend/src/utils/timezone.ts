import { format } from 'date-fns';

/**
 * The backend always stores and returns timestamps as UTC ISO strings
 * (see backend/src/models/Event.model.js — plain mongoose `Date` fields).
 * The UI displays and collects every time in the *viewer's own browser/
 * device timezone* — whatever IANA zone `Intl` resolves to at runtime.
 *
 * There is no app-wide fixed zone here on purpose: two people in different
 * timezones should each see the same UTC instant rendered at their own
 * correct local wall-clock time, exactly like Google Calendar does.
 */

/** The IANA timezone name the browser is currently running in, e.g. "Asia/Kolkata". */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * A short label for the browser's current UTC offset, e.g. "GMT+5:30" or
 * "GMT-7". Used as the compact indicator near the notification bell and in
 * form captions, so people always know what zone the times on screen are in.
 */
export function getUtcOffsetLabel(date: Date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset(); // getTimezoneOffset() is UTC-minus-local; flip sign
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `GMT${sign}${hours}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`;
}

/**
 * A friendly, full display label for the viewer's timezone, e.g.
 * "India Standard Time (GMT+5:30)". Falls back to just the offset if the
 * browser can't resolve a long zone name for some reason.
 */
export function getTimeZoneDisplayLabel(date: Date = new Date()): string {
  const offset = getUtcOffsetLabel(date);
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).formatToParts(date);
    const zoneName = parts.find((p) => p.type === 'timeZoneName')?.value;
    return zoneName ? `${zoneName} (${offset})` : offset;
  } catch {
    return offset;
  }
}

/**
 * Format a UTC ISO string for display in the viewer's own local timezone.
 * (Previously called `formatIst` and hardcoded to Asia/Kolkata — now
 * genuinely local to whoever is looking at the screen.)
 */
export function formatLocal(utcIso: string, pattern: string): string {
  if (!utcIso) return '';
  return format(new Date(utcIso), pattern);
}

/**
 * Parse the value of an <input type="datetime-local"> (a naive
 * "YYYY-MM-DDTHH:mm" string with no timezone) into a UTC ISO string.
 *
 * No manual zone math needed: per spec, `new Date('YYYY-MM-DDTHH:mm')`
 * (no trailing Z/offset) is parsed as *local* wall-clock time by every
 * browser, using whatever zone that browser is actually in. `.toISOString()`
 * then converts that to the correct UTC instant for the API.
 */
export function datetimeLocalValueToUtcIso(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

/**
 * Format a UTC ISO string into a value usable by <input type="datetime-local">,
 * expressed in the viewer's own local wall-clock time.
 */
export function utcIsoToDatetimeLocalValue(utcIso: string): string {
  if (!utcIso) return '';
  return format(new Date(utcIso), "yyyy-MM-dd'T'HH:mm");
}