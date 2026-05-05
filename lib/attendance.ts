import "server-only";

export const WORK_START_HOUR = 9;
export const GRACE_PERIOD_MINUTES = 15;
export const EARLIEST_CLOCK_IN_HOUR = 6;
export const MIN_WORK_HOURS = 8;

export function getWIBHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date),
  );
}

export function getWIBMinutes(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      minute: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(date),
  );
}

export function getClockInStatus(date: Date): {
  status: "present" | "late";
  error?: string;
} {
  const hour = getWIBHour(date);
  const minutes = getWIBMinutes(date);

  if (hour < EARLIEST_CLOCK_IN_HOUR) {
    return {
      status: "present",
      error: "Belum bisa absen, jam masuk dibuka mulai pukul 06:00 WIB",
    };
  }

  const totalMinutes = hour * 60 + minutes;
  const graceEnd = WORK_START_HOUR * 60 + GRACE_PERIOD_MINUTES;

  if (totalMinutes <= graceEnd) {
    return { status: "present" };
  }

  return { status: "late" };
}

export function getClockOutStatus(
  clockInDate: Date,
  clockOutDate: Date,
  currentStatus: string,
): string {
  const clockInMs = clockInDate.getTime();
  const clockOutMs = clockOutDate.getTime();
  const durationHours = (clockOutMs - clockInMs) / (1000 * 60 * 60);

  if (durationHours >= MIN_WORK_HOURS) {
    return currentStatus;
  }

  if (currentStatus === "present") {
    return "early_leave";
  }

  return currentStatus;
}
