const WEEKDAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type WeekdayOption = (typeof WEEKDAY_OPTIONS)[number];

export const CLUB_WEEKDAY_OPTIONS = [...WEEKDAY_OPTIONS];

export function parseMeetingDays(value: string | null | undefined) {
  if (!value) {
    return {
      selectedDays: [] as WeekdayOption[],
      customLabel: "",
      isCustom: false,
    };
  }

  const normalized = value.trim();
  const selectedDays = WEEKDAY_OPTIONS.filter((day) => normalized.includes(day));
  const weekdayMatches = selectedDays.length > 0;
  const leftover = normalized
    .replace(/\s*&\s*/g, " & ")
    .trim();
  const isExactWeekdayList = weekdayMatches && buildMeetingDayValue(selectedDays) === normalized;

  return {
    selectedDays,
    customLabel: isExactWeekdayList ? "" : leftover,
    isCustom: !isExactWeekdayList && (!weekdayMatches || leftover.length > 0),
  };
}

export function buildMeetingDayValue(days: readonly WeekdayOption[], customLabel?: string) {
  const uniqueDays = WEEKDAY_OPTIONS.filter((day) => days.includes(day));
  const normalizedCustom = customLabel?.trim().replace(/\s+/g, " ") ?? "";

  if (normalizedCustom) return normalizedCustom;
  if (uniqueDays.length === 0) return "";
  if (uniqueDays.length === 1) return uniqueDays[0];
  if (uniqueDays.length === 2) return `${uniqueDays[0]} & ${uniqueDays[1]}`;
  return uniqueDays.join(" / ");
}
