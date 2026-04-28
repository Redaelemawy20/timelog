export function formatDayMonth(value: string): string {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

export function toHoursAndMinutes(timeHours: string | null): { hours: number; minutes: number } {
  const parsed = Number(timeHours);
  if (!Number.isFinite(parsed) || parsed < 0) return { hours: 0, minutes: 0 };
  const totalMinutes = Math.round(parsed * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function toTimeHoursValue(hours: number, minutes: number): string {
  return (hours + minutes / 60).toFixed(2);
}

export function formatTimeHours(timeHours: string | null): string {
  if (!timeHours) return "No time";
  const { hours, minutes } = toHoursAndMinutes(timeHours);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h:${String(minutes).padStart(2, "0")}m`;
}
