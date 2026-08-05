// HA's standard weather-condition -> mdi icon mapping (matches the icons
// used by Home Assistant's own weather card/entity).
const ICONS: Record<string, string> = {
  'clear-night': 'mdi:weather-night',
  cloudy: 'mdi:weather-cloudy',
  exceptional: 'mdi:alert-circle-outline',
  fog: 'mdi:weather-fog',
  hail: 'mdi:weather-hail',
  lightning: 'mdi:weather-lightning',
  'lightning-rainy': 'mdi:weather-lightning-rainy',
  partlycloudy: 'mdi:weather-partly-cloudy',
  pouring: 'mdi:weather-pouring',
  rainy: 'mdi:weather-rainy',
  snowy: 'mdi:weather-snowy',
  'snowy-rainy': 'mdi:weather-snowy-rainy',
  sunny: 'mdi:weather-sunny',
  windy: 'mdi:weather-windy',
  'windy-variant': 'mdi:weather-windy-variant',
};

const FALLBACK_ICON = 'mdi:weather-cloudy';

export const getWeatherIcon = (condition: string, isNight = false): string => {
  const raw = (condition || '').toLowerCase();
  const base = raw.replace(/-night$/, '').replace(/-day$/, '');

  if (isNight || raw.endsWith('-night')) {
    if (base === 'clear' || base === 'sunny') return ICONS['clear-night'];
    if (base === 'partlycloudy') return 'mdi:weather-night-partly-cloudy';
  }

  return ICONS[base] ?? FALLBACK_ICON;
};
