/**
 * All times are shown and entered in IST, regardless of the viewer's or server's timezone.
 * The API always exchanges absolute UTC instants (ISO strings), so only display and input convert.
 */
export const APP_TIME_ZONE = "Asia/Kolkata";
export const APP_TIME_ZONE_LABEL = "IST";
const IST_OFFSET = "+05:30";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const timeOnly = new Intl.DateTimeFormat("en-IN", { timeZone: APP_TIME_ZONE, hour: "numeric", minute: "2-digit" });

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "25 Sept, 7:45 pm" in IST. */
export function formatDateTime(iso: string | Date) {
  return dateTime.format(new Date(iso));
}

/** "7:45 pm" in IST. */
export function formatTime(iso: string | Date) {
  return timeOnly.format(new Date(iso));
}

/** Hour of day (0-23) in IST. */
export function istHour(date = new Date()) {
  const hour = parts.formatToParts(date).find((p) => p.type === "hour")?.value;
  return Number(hour);
}

/** Value for an `<input type="datetime-local">`, as IST wall-clock time ("2026-09-25T19:45"). */
export function toIstInput(date: Date) {
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Reads a `datetime-local` value as IST, whatever the browser's own timezone is. */
export function fromIstInput(value: string) {
  return new Date(`${value}:00${IST_OFFSET}`);
}

/** IST input value for `minutes` from now, rounded up to the next 5 minutes. */
export function istInputInMinutes(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000);
  d.setUTCMinutes(Math.ceil(d.getUTCMinutes() / 5) * 5, 0, 0);
  return toIstInput(d);
}

/** IST input value for the current minute (never in the future, unlike the rounded-up helpers). */
export function istInputNow() {
  return toIstInput(new Date());
}
