import { HomeAssistant } from 'custom-card-helpers';
import { ForecastAttributes, ForecastType } from 'hooks';

const toTimestamp = (item: ForecastAttributes): number | null => {
  const ts = item?.datetime ? new Date(item.datetime).getTime() : NaN;
  return Number.isNaN(ts) ? null : ts;
};

// Sorts by timestamp (undated items last), drops hourly entries more than
// 30 minutes stale (a subscription can briefly hand back the previous
// hour's leading entry right as it rolls over), then slices to the
// configured max. Falls back to the full sorted list if trimming would
// leave nothing to show.
export const normalizeForecast = (
  raw: ForecastAttributes[] | undefined,
  type: ForecastType,
  maxItems: number,
): ForecastAttributes[] => {
  if (!Array.isArray(raw)) return [];

  const sorted = [...raw].sort((a, b) => {
    const ta = toTimestamp(a);
    const tb = toTimestamp(b);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  });

  const cutoff = Date.now() - 30 * 60 * 1000;
  const trimmed = type === 'hourly'
    ? sorted.filter((item) => {
      const ts = toTimestamp(item);
      return ts == null || ts >= cutoff;
    })
    : sorted;

  const usable = trimmed.length ? trimmed : sorted;
  return usable.slice(0, maxItems);
};

export const isNight = (
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
  forecastItem?: ForecastAttributes,
): boolean => {
  if (typeof forecastItem?.is_daytime === 'boolean') return !forecastItem.is_daytime;

  const entityIsDaytime = entityId
    ? hass?.states[entityId]?.attributes.is_daytime as boolean | undefined
    : undefined;
  if (typeof entityIsDaytime === 'boolean') return !entityIsDaytime;

  const sunState = hass?.states['sun.sun']?.state;
  if (sunState === 'below_horizon') return true;
  if (sunState === 'above_horizon') return false;

  const hour = new Date(forecastItem?.datetime ?? Date.now()).getHours();
  return hour < 6 || hour >= 20;
};

export const formatTemp = (hass: HomeAssistant | undefined, value: number | undefined): string => {
  if (value == null || Number.isNaN(value)) return '';
  const unit = hass?.config?.unit_system?.temperature ?? '°C';
  return `${Math.round(value)}${unit.replace('°', ' °')}`.replace('  ', ' ');
};

export const formatLabel = (
  hass: HomeAssistant | undefined,
  datetime: string | undefined,
  isHourly: boolean,
): string => {
  if (!datetime) return '';
  try {
    const date = new Date(datetime);
    if (isHourly) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    const lang = hass?.locale?.language || navigator.language || 'en-US';
    return date.toLocaleDateString(lang, { weekday: 'short' });
  } catch {
    return '';
  }
};
