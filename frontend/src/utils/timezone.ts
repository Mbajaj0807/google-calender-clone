import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * The backend always stores and returns timestamps as UTC ISO strings
 * (see backend/src/models/Event.model.js — plain mongoose `Date` fields).
 * The UI always displays and collects times in IST regardless of the
 * viewer's actual machine timezone, per product requirement.
 */
export const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert a UTC ISO string (from the API) into a Date representing
 * the equivalent wall-clock time in IST. Use this before formatting
 * for display.
 */
export function utcToIst(utcIso: string): Date {
  return toZonedTime(utcIso, APP_TIMEZONE);
}

/**
 * Convert a "naive" local Date (e.g. built from <input type="datetime-local">,
 * which has no timezone info and is interpreted as IST wall-clock time here)
 * into a UTC ISO string suitable for sending to the API.
 */
export function istToUtcIso(istWallClockDate: Date): string {
  return fromZonedTime(istWallClockDate, APP_TIMEZONE).toISOString();
}

/**
 * Format a UTC ISO string for display in IST.
 */
export function formatIst(utcIso: string, pattern: string): string {
  return formatTz(utcToIst(utcIso), pattern, { timeZone: APP_TIMEZONE });
}

/**
 * Parse the value of an <input type="datetime-local"> (a naive
 * "YYYY-MM-DDTHH:mm" string with no timezone) into a UTC ISO string,
 * treating the input value as IST wall-clock time.
 */
export function datetimeLocalValueToUtcIso(value: string): string {
  if (!value) return '';
  // new Date('YYYY-MM-DDTHH:mm') is parsed as local-machine time by the JS
  // engine, which is NOT necessarily IST. Parse the parts manually instead
  // so the string is always interpreted as IST wall-clock time, independent
  // of where the browser itself is running.
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  // Build a UTC-based "fake" Date whose fields are the IST wall-clock numbers,
  // then tell fromZonedTime to treat those fields as IST.
  const naiveAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return fromZonedTime(naiveAsUtc, APP_TIMEZONE).toISOString();
}

/**
 * Format a UTC ISO string into a value usable by <input type="datetime-local">,
 * displaying the equivalent IST wall-clock time (verified against date-fns-tz directly:
 * formatting toZonedTime's output with the same IANA zone yields the correct
 * wall-clock fields regardless of the browser's own local timezone).
 */
export function utcIsoToDatetimeLocalValue(utcIso: string): string {
  if (!utcIso) return '';
  return formatTz(utcToIst(utcIso), "yyyy-MM-dd'T'HH:mm", { timeZone: APP_TIMEZONE });
}