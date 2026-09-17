import type { Weekday } from "./types";

export const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const ORDERED_WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function getLocalDate(input: Date = new Date()): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekday(input: Date | string = new Date()): Weekday {
  const date = typeof input === "string" ? parseLocalDate(input) : input;
  return WEEKDAYS[date.getDay()];
}

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: string, days: number): string {
  const value = parseLocalDate(date);
  value.setDate(value.getDate() + days);
  return getLocalDate(value);
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Rounds because parseLocalDate builds local midnight, so a span crossing a DST
// transition is 23 or 25 hours and would floor to the wrong number of days.
export function diffDays(a: string, b: string): number {
  const from = parseLocalDate(a).getTime();
  const to = parseLocalDate(b).getTime();
  return Math.round((to - from) / MILLISECONDS_PER_DAY);
}

export function formatDisplayDate(date: string | Date = new Date()): string {
  const value = typeof date === "string" ? parseLocalDate(date) : date;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function getWeekStart(input: Date | string = new Date()): string {
  const date = typeof input === "string" ? parseLocalDate(input) : new Date(input);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return getLocalDate(date);
}

export function isWeekend(date: string | Date = new Date()): boolean {
  const weekday = getWeekday(date);
  return weekday === "saturday" || weekday === "sunday";
}
