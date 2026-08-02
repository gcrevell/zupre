import { TemperatureUnit } from '../types';

const pad = (n: number) => n.toString().padStart(2, '0');

// Compact, always-on units: "1d 2h 3m 4s" (only non-zero leading units shown).
export const formatDurationExact = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (d > 0 || h > 0) parts.push(`${h}h`);
  if (d > 0 || h > 0 || m > 0) parts.push(`${m}m`);
  if (d === 0 && h === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
};

// Coarse, single-unit humanization: "2 hours", "5 minutes".
export const formatDurationRounded = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const units: [number, string][] = [
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  const unit = units.find(([size]) => seconds >= size);
  if (!unit) return `${seconds} sec`;
  const [size, label] = unit;
  const count = Math.round(seconds / size);
  return `${count} ${label}${count === 1 ? '' : 's'}`;
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
