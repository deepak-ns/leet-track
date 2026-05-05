export const INDIA_TIME_ZONE = "Asia/Kolkata";

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayDateKey(timeZone = INDIA_TIME_ZONE): string {
  return formatDateInTimeZone(new Date(), timeZone);
}

