import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { Config, MonitoredCondition, SensorOverride } from '../types';
import {
  formatDuration, formatTemperature, formatTimeOfDay, temperatureUnitFromMeasurement,
} from './format';

export type Stat = {
  key: string;
  name: string;
  value: string;
};

const getEntity = (hass: HomeAssistant | undefined, entityId?: string): HassEntity | undefined => (
  entityId ? hass?.states[entityId] : undefined
);

// `config.sensors` lets a condition (or arbitrary custom key) point at an
// entity/attribute outside the `${base_entity}${suffix}` convention below —
// used for hotend/bed temperatures, which PrusaLink doesn't expose as
// separate `base_entity`-prefixed entities, or any other custom naming.
const resolveOverride = (
  hass: HomeAssistant | undefined,
  config: Config,
  key: string,
): { entity?: HassEntity; value?: string; name?: string } => {
  const override: SensorOverride | undefined = config.sensors?.[key];
  if (!override) return {};
  const entity = getEntity(hass, override.entity);
  const value = override.attribute ? entity?.attributes[override.attribute] : entity?.state;
  return { entity, value, name: override.name };
};

// PrusaLink's own status is the base entity's state directly — there's no
// `${base_entity}_current_state`-style sub-entity for it.
export const resolveStatus = (hass: HomeAssistant | undefined, config: Config): string => {
  const override = resolveOverride(hass, config, MonitoredCondition.Status);
  if (override.value !== undefined) return String(override.value);

  return getEntity(hass, config.base_entity)?.state ?? 'unknown';
};

export const resolvePercent = (hass: HomeAssistant | undefined, config: Config): number => {
  const overrideValue = resolveOverride(hass, config, 'Progress').value
    ?? resolveOverride(hass, config, 'progress').value;
  if (overrideValue !== undefined) return Number(overrideValue);

  const value = getEntity(hass, `${config.base_entity}_progress`)?.state;
  const percent = Number(value);
  return Number.isFinite(percent) ? percent : 0;
};

// `unknown`/`unavailable`/etc. are non-empty strings that fail Date.parse,
// so a plain truthy check on the raw state isn't enough to avoid NaN leaking
// into formatDuration/formatTimeOfDay (a stopped printer's `_print_start`/
// `_print_finish` reports exactly this while there's no active job).
const parseTimestamp = (state?: string): number | undefined => {
  if (!state) return undefined;
  const parsed = Date.parse(state);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// PrusaLink reports absolute ISO timestamps (`_print_start`/`_print_finish`)
// that we diff against now, rather than a live seconds count.
const resolveElapsedSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const override = resolveOverride(hass, config, MonitoredCondition.Elapsed);
  if (override.value !== undefined) {
    const parsed = parseTimestamp(String(override.value));
    return parsed !== undefined ? (Date.now() - parsed) / 1000 : undefined;
  }

  const start = parseTimestamp(getEntity(hass, `${config.base_entity}_print_start`)?.state);
  return start !== undefined ? (Date.now() - start) / 1000 : undefined;
};

const resolveRemainingSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const overrideValue = resolveOverride(hass, config, MonitoredCondition.Remaining).value
    ?? resolveOverride(hass, config, MonitoredCondition.ETA).value;
  if (overrideValue !== undefined) {
    const parsed = parseTimestamp(String(overrideValue));
    return parsed !== undefined ? (parsed - Date.now()) / 1000 : undefined;
  }

  const finish = parseTimestamp(getEntity(hass, `${config.base_entity}_print_finish`)?.state);
  return finish !== undefined ? (finish - Date.now()) / 1000 : undefined;
};

// Not exposed as separate `base_entity`-prefixed entities on PrusaLink —
// needs a `sensors:` override pointing at wherever your setup actually
// publishes hotend/bed temperature.
const resolveTemperatureStat = (
  hass: HomeAssistant | undefined,
  config: Config,
  condition: MonitoredCondition.Hotend | MonitoredCondition.Bed,
): Stat => {
  const override = resolveOverride(hass, config, condition);
  const value = Number(override.value);

  if (!Number.isFinite(value)) {
    return { key: condition, name: override.name ?? condition, value: '—' };
  }

  const unit = temperatureUnitFromMeasurement(override.entity?.attributes.unit_of_measurement);
  return {
    key: condition,
    name: override.name ?? condition,
    value: formatTemperature(value, unit, config.temperature_unit, config.round_temperature),
  };
};

const resolveStat = (
  hass: HomeAssistant | undefined,
  config: Config,
  condition: MonitoredCondition | string,
): Stat => {
  switch (condition) {
    case MonitoredCondition.Status:
      return { key: condition, name: 'Status', value: resolveStatus(hass, config) };

    case MonitoredCondition.Elapsed: {
      const seconds = resolveElapsedSeconds(hass, config);
      return {
        key: condition,
        name: 'Elapsed',
        value: seconds !== undefined ? formatDuration(seconds, config.round_time) : '—',
      };
    }

    case MonitoredCondition.Remaining: {
      const seconds = resolveRemainingSeconds(hass, config);
      return {
        key: condition,
        name: 'Remaining',
        value: seconds !== undefined ? formatDuration(seconds, config.round_time) : '—',
      };
    }

    case MonitoredCondition.ETA: {
      const seconds = resolveRemainingSeconds(hass, config);
      return {
        key: condition,
        name: 'ETA',
        value: seconds !== undefined
          ? formatTimeOfDay(new Date(Date.now() + seconds * 1000), config.use_24hr)
          : '—',
      };
    }

    case MonitoredCondition.Hotend:
    case MonitoredCondition.Bed:
      return resolveTemperatureStat(hass, config, condition);

    default: {
      const override = resolveOverride(hass, config, condition);
      return {
        key: condition,
        name: override.name ?? condition,
        value: override.value !== undefined ? String(override.value) : '—',
      };
    }
  }
};

export const resolveStats = (hass: HomeAssistant | undefined, config: Config): Stat[] => (
  (config.monitored ?? []).map((condition) => resolveStat(hass, config, condition))
);
