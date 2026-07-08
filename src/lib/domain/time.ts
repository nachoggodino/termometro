export const APP_TIME_ZONE = "Europe/Madrid";

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getZonedDateParts(date: Date): ZonedDateParts {
  const parts = Object.fromEntries(zonedDateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getZonedDateParts(date);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return localAsUtc - date.getTime();
}

export function fromMadridTime(
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  const localAsUtc = Date.UTC(year, monthIndex, day, hour, minute, second, millisecond);
  let instant = new Date(localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc)));
  instant = new Date(localAsUtc - getTimeZoneOffsetMs(instant));
  return instant;
}

export function getMadridDateParts(date: Date) {
  const { year, month, day } = getZonedDateParts(date);
  return { year, month, day };
}

export function getMadridStartOfDay(date: Date, dayOffset = 0) {
  const { year, month, day } = getMadridDateParts(date);
  return fromMadridTime(year, month - 1, day + dayOffset);
}
