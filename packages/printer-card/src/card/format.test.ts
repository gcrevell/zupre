import { TemperatureUnit } from '../types';
import {
  convertTemperature,
  formatDuration,
  formatDurationExact,
  formatDurationRounded,
  formatTemperature,
  formatTimeOfDay,
  temperatureUnitFromMeasurement,
} from './format';

describe('formatDurationExact', () => {
  it('shows only seconds under a minute', () => {
    expect(formatDurationExact(5)).toBe('5s');
  });

  it('shows minutes and seconds under an hour', () => {
    expect(formatDurationExact(125)).toBe('2m 5s');
  });

  it('drops seconds once hours are shown', () => {
    expect(formatDurationExact(3661)).toBe('1h 1m');
  });

  it('shows days, hours, and minutes for multi-day durations', () => {
    expect(formatDurationExact(90061)).toBe('1d 1h 1m');
  });

  it('clamps negative durations to zero', () => {
    expect(formatDurationExact(-30)).toBe('0s');
  });
});

describe('formatDurationRounded', () => {
  it('reports whole seconds under a minute', () => {
    expect(formatDurationRounded(45)).toBe('45 sec');
  });

  it('rounds to the nearest minute, pluralized', () => {
    expect(formatDurationRounded(90)).toBe('2 minutes');
  });

  it('uses the singular form for a count of one', () => {
    expect(formatDurationRounded(3600)).toBe('1 hour');
  });

  // Regression: rounding within the selected unit used to overflow into the
  // next unit's own threshold (e.g. 3599/60 rounds to 60, which was
  // displayed as "60 minutes" instead of promoting to "1 hour").
  it('promotes to the next unit instead of overflowing (minute -> hour)', () => {
    expect(formatDurationRounded(3599)).toBe('1 hour');
  });

  it('promotes to the next unit instead of overflowing (hour -> day)', () => {
    expect(formatDurationRounded(86399)).toBe('1 day');
  });

  it('rounds to the nearest day', () => {
    expect(formatDurationRounded(90000)).toBe('1 day');
  });
});

describe('formatDuration', () => {
  it('delegates to the rounded formatter when round is true', () => {
    expect(formatDuration(90, true)).toBe('2 minutes');
  });

  it('delegates to the exact formatter otherwise', () => {
    expect(formatDuration(90, false)).toBe('1m 30s');
  });
});

describe('formatTimeOfDay', () => {
  it('formats 24-hour time zero-padded', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 9, 5), true)).toBe('09:05');
  });

  it('formats 12-hour time with AM/PM', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 13, 5), false)).toBe('1:05 PM');
  });

  it('formats midnight as 12 AM', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 0, 30), false)).toBe('12:30 AM');
  });

  it('formats noon as 12 PM', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 12, 0), false)).toBe('12:00 PM');
  });
});

describe('convertTemperature', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(convertTemperature(100, TemperatureUnit.C, TemperatureUnit.F)).toBeCloseTo(212);
  });

  it('converts Fahrenheit to Celsius', () => {
    expect(convertTemperature(32, TemperatureUnit.F, TemperatureUnit.C)).toBeCloseTo(0);
  });

  it('passes the value through unchanged for matching units', () => {
    expect(convertTemperature(50, TemperatureUnit.C, TemperatureUnit.C)).toBe(50);
  });
});

describe('temperatureUnitFromMeasurement', () => {
  it('recognizes Fahrenheit', () => {
    expect(temperatureUnitFromMeasurement('°F')).toBe(TemperatureUnit.F);
  });

  it('defaults to Celsius for anything else, including nothing', () => {
    expect(temperatureUnitFromMeasurement('°C')).toBe(TemperatureUnit.C);
    expect(temperatureUnitFromMeasurement(undefined)).toBe(TemperatureUnit.C);
  });
});

describe('formatTemperature', () => {
  it('converts and rounds when round is true', () => {
    expect(formatTemperature(100, TemperatureUnit.C, TemperatureUnit.F, true)).toBe('212°F');
  });

  it('keeps one decimal place when round is false', () => {
    expect(formatTemperature(100, TemperatureUnit.C, TemperatureUnit.F, false)).toBe('212.0°F');
  });

  it('falls back to the source unit when no target is given', () => {
    expect(formatTemperature(21.4, TemperatureUnit.C, undefined, true)).toBe('21°C');
  });
});
