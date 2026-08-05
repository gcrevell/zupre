import { HomeAssistant } from 'custom-card-helpers';
import { ForecastAttributes } from 'hooks';
import {
  formatLabel, formatTemp, isNight, normalizeForecast,
} from './forecast';

const item = (datetime: string, extra: Partial<ForecastAttributes> = {}): ForecastAttributes => ({
  datetime, ...extra,
});

describe('normalizeForecast', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeForecast(undefined, 'daily', 5)).toEqual([]);
  });

  it('sorts unordered input by datetime', () => {
    const result = normalizeForecast(
      [item('2024-01-03T00:00:00Z'), item('2024-01-01T00:00:00Z'), item('2024-01-02T00:00:00Z')],
      'daily',
      5,
    );
    expect(result.map((i) => i.datetime)).toEqual([
      '2024-01-01T00:00:00Z',
      '2024-01-02T00:00:00Z',
      '2024-01-03T00:00:00Z',
    ]);
  });

  it('respects the max item slice', () => {
    const items = Array.from({ length: 10 }, (_, i) => item(`2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
    expect(normalizeForecast(items, 'daily', 3)).toHaveLength(3);
  });

  it('drops hourly entries more than 30 minutes stale', () => {
    const now = Date.now();
    const stale = item(new Date(now - 60 * 60 * 1000).toISOString());
    const fresh = item(new Date(now + 60 * 60 * 1000).toISOString());
    const result = normalizeForecast([stale, fresh], 'hourly', 10);
    expect(result).toEqual([fresh]);
  });

  it('does not drop stale entries for non-hourly types', () => {
    const now = Date.now();
    const stale = item(new Date(now - 60 * 60 * 1000).toISOString());
    const result = normalizeForecast([stale], 'daily', 10);
    expect(result).toEqual([stale]);
  });

  it('falls back to the full sorted list if trimming would leave nothing', () => {
    const now = Date.now();
    const allStale = [
      item(new Date(now - 2 * 60 * 60 * 1000).toISOString()),
      item(new Date(now - 3 * 60 * 60 * 1000).toISOString()),
    ];
    const result = normalizeForecast(allStale, 'hourly', 10);
    expect(result).toHaveLength(2);
  });
});

describe('isNight', () => {
  it('prefers the forecast item is_daytime when present', () => {
    expect(isNight(undefined, undefined, item('2024-01-01T12:00:00', { is_daytime: false }))).toBe(true);
    expect(isNight(undefined, undefined, item('2024-01-01T02:00:00', { is_daytime: true }))).toBe(false);
  });

  it('falls back to the entity is_daytime attribute', () => {
    const hass = {
      states: { 'weather.home': { attributes: { is_daytime: false } } },
    } as unknown as HomeAssistant;
    expect(isNight(hass, 'weather.home', item('2024-01-01T12:00:00'))).toBe(true);
  });

  it('falls back to sun.sun state', () => {
    const below = { states: { 'sun.sun': { state: 'below_horizon' } } } as unknown as HomeAssistant;
    const above = { states: { 'sun.sun': { state: 'above_horizon' } } } as unknown as HomeAssistant;
    expect(isNight(below, undefined, item('2024-01-01T12:00:00'))).toBe(true);
    expect(isNight(above, undefined, item('2024-01-01T02:00:00'))).toBe(false);
  });

  it('falls back to hour-of-day when nothing else is available', () => {
    expect(isNight(undefined, undefined, item('2024-01-01T02:00:00'))).toBe(true);
    expect(isNight(undefined, undefined, item('2024-01-01T12:00:00'))).toBe(false);
  });
});

describe('formatTemp', () => {
  it('rounds and appends the configured unit', () => {
    const hass = { config: { unit_system: { temperature: '°C' } } } as unknown as HomeAssistant;
    expect(formatTemp(hass, 20.6)).toBe('21 °C');
  });

  it('defaults to Celsius when hass is unavailable', () => {
    expect(formatTemp(undefined, 5)).toBe('5 °C');
  });

  it('returns an empty string for missing or NaN values', () => {
    expect(formatTemp(undefined, undefined)).toBe('');
    expect(formatTemp(undefined, NaN)).toBe('');
  });
});

describe('formatLabel', () => {
  it('formats hourly labels as HH:MM', () => {
    expect(formatLabel(undefined, '2024-01-01T09:05:00', true)).toBe('09:05');
  });

  it('formats daily labels as a weekday', () => {
    // 2024-01-01 is a Monday; noon avoids any timezone-driven date rollover.
    const label = formatLabel(undefined, '2024-01-01T12:00:00', false);
    expect(label.toLowerCase()).toContain('mon');
  });

  it('returns an empty string for missing datetime', () => {
    expect(formatLabel(undefined, undefined, true)).toBe('');
  });
});
