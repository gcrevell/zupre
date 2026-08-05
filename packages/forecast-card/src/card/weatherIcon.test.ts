import { getWeatherIcon } from './weatherIcon';

describe('getWeatherIcon', () => {
  it('maps known day conditions', () => {
    expect(getWeatherIcon('sunny')).toBe('mdi:weather-sunny');
    expect(getWeatherIcon('rainy')).toBe('mdi:weather-rainy');
    expect(getWeatherIcon('lightning-rainy')).toBe('mdi:weather-lightning-rainy');
  });

  it('is case-insensitive', () => {
    expect(getWeatherIcon('SUNNY')).toBe('mdi:weather-sunny');
  });

  it('maps clear/sunny at night to the moon icon', () => {
    expect(getWeatherIcon('clear', true)).toBe('mdi:weather-night');
    expect(getWeatherIcon('sunny', true)).toBe('mdi:weather-night');
  });

  it('maps a condition already suffixed with -night', () => {
    expect(getWeatherIcon('clear-night')).toBe('mdi:weather-night');
  });

  it('maps partly cloudy at night to the night-partly-cloudy icon', () => {
    expect(getWeatherIcon('partlycloudy', true)).toBe('mdi:weather-night-partly-cloudy');
  });

  it('does not apply the night variant to conditions without one (e.g. cloudy)', () => {
    expect(getWeatherIcon('cloudy', true)).toBe('mdi:weather-cloudy');
  });

  it('falls back to a generic icon for unknown conditions', () => {
    expect(getWeatherIcon('made-up-condition')).toBe('mdi:weather-cloudy');
    expect(getWeatherIcon('')).toBe('mdi:weather-cloudy');
  });
});
