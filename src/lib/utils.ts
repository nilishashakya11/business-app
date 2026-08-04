import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Nepalese Rupee currency. */
export function formatCurrency(amount: number | string, currency = "NPR") {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Format a Date as a local `YYYY-MM-DD` string. Unlike
 * `toISOString().slice(0, 10)`, this uses local calendar parts, so it never
 * shifts to the adjacent day in timezones offset from UTC (e.g. en-NP, +5:45).
 */
export function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Add days to a date, returning a new Date (does not mutate). */
export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Return midnight on the Sunday that starts the week containing `date`. */
export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 0 = Sunday
  return d;
}

/** Format a date for display. */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  // `dateStyle` can't be combined with individual component options (weekday,
  // day, month, ...) — Intl throws. Only apply the default when no opts given.
  const options: Intl.DateTimeFormatOptions = opts ?? { dateStyle: "medium" };
  return new Intl.DateTimeFormat("en-NP", options).format(d);
}

/** Format a time (HH:mm). */
export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Format a date and time together (e.g. "12 Jul 2026, 02:30 PM"). */
export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Generate a human-readable, unique-ish document number. */
export function generateDocNumber(prefix: string) {
  const now = new Date();
  const stamp =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${rand}`;
}

/** Return initials for an avatar fallback. */
export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Turn a business name into a URL-safe slug, e.g. "Serenity Spa!" -> "serenity-spa". */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
