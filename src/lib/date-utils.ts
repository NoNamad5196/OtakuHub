import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

export function todayIso() {
  return dayjs().format("YYYY-MM-DD");
}

export function addDaysIso(date: string, days: number) {
  return dayjs(date).add(days, "day").format("YYYY-MM-DD");
}

export function formatDate(date: string) {
  return dayjs(date).format("M월 D일 ddd");
}

export function formatDateRange(startDate: string, endDate?: string | null) {
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function daysUntil(date: string) {
  return dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
}

export function isWithinDays(date: string, days: number) {
  const delta = daysUntil(date);
  return delta >= 0 && delta <= days;
}

export function inferDatesFromText(text: string, baseDate = todayIso()) {
  const currentYear = dayjs(baseDate).year();
  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(/(\d{1,2})\s*[./월]\s*(\d{1,2})\s*(?:일)?/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return dayjs(`${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`).format(
    "YYYY-MM-DD",
  );
}
