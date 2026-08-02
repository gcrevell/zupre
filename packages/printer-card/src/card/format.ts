import { TemperatureUnit } from '../types';

const pad = (n: number) => n.toString().padStart(2, '0');

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

const clampSeconds = (totalSeconds: number) => Math.max(0, Math.round(totalSeconds));

// Compact, always-on units: "1d 2h 3m 4s" (only non-zero leading units shown).
export const formatDurationExact = (totalSeconds: number): string => {
  const seconds = clampSeconds(totalSeconds);
  const d = Math.floor(seconds / SECONDS_PER_DAY);
  const h = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const m = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = seconds % SECONDS_PER_MINUTE;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (d > 0 || h > 0) parts.push(`${h}h`);
  if (d > 0 || h > 0 || m > 0) parts.push(`${m}m`);
  if (d === 0 && h === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
};

const pluralize = (count: number, label: string) => `${count} ${label}${count === 1 ? '' : 's'}`;

// Coarse, single-unit humanization: "2 hours", "5 minutes". Units are tried
// largest-first, but rounding within a unit can reach that unit's own
// conversion factor into the next larger one (e.g. 3599s / 60 rounds to
// "60 minutes", which should read as "1 hour") — when that happens, the
// promoted count is recomputed against the larger unit instead of displaying
// the overflowed count in the smaller one.
const ROUNDED_UNITS: [number, string][] = [
  [SECONDS_PER_DAY, 'day'],
  [SECONDS_PER_HOUR, 'hour'],
  [SECONDS_PER_MINUTE, 'minute'],
];

export const formatDurationRounded = (totalSeconds: number): string => {
  const seconds = clampSeconds(totalSeconds);

  for (let i = 0; i < ROUNDED_UNITS.length; i += 1) {
    const [size, label] = ROUNDED_UNITS[i];
    if (seconds < size) continue;

    const count = Math.round(seconds / size);
    const largerUnit = ROUNDED_UNITS[i - 1];
    if (largerUnit && count * size >= largerUnit[0]) {
      return pluralize(Math.round(seconds / largerUnit[0]), largerUnit[1]);
    }
    return pluralize(count, label);
  }

  return `${seconds} sec`;
};

export const formatDuration = (totalSeconds: number, round?: boolean) => (
  round ? formatDurationRounded(totalSeconds) : formatDurationExact(totalSeconds)
);

export const formatTimeOfDay = (date: Date, use24hr?: boolean): string => {
  if (use24hr) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const hours24 = date.getHours();
  const hours = hours24 % 12 || 12;
  const period = hours24 < 12 ? 'AM' : 'PM';
  return `${hours}:${pad(date.getMinutes())} ${period}`;
};

const toCelsius = (value: number, from: TemperatureUnit) => (
  from === TemperatureUnit.F ? ((value - 32) * 5) / 9 : value
);

const fromCelsius = (value: number, to: TemperatureUnit) => (
  to === TemperatureUnit.F ? (value * 9) / 5 + 32 : value
);

export const convertTemperature = (
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit,
): number => (from === to ? value : fromCelsius(toCelsius(value, from), to));

export const temperatureUnitFromMeasurement = (unitOfMeasurement?: string): TemperatureUnit => (
  unitOfMeasurement === '°F' ? TemperatureUnit.F : TemperatureUnit.C
);

export const formatTemperature = (
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit | undefined,
  round?: boolean,
): string => {
  const target = to ?? from;
  const converted = convertTemperature(value, from, target);
  return `${round ? Math.round(converted) : converted.toFixed(1)}°${target}`;
};
