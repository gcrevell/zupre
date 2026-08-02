import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { Config, MonitoredCondition, SensorOverride } from '../types';
import { log } from '../debug';
import {
  formatDuration, formatTemperature, formatTimeOfDay, temperatureUnitFromMeasurement,
} from './format';

export type Stat = {
  key: string;
  name: string;
  value: string;
};

// Logged once per missing entity id (not every render/hass tick) so this
// stays readable while narrowing down a base_entity/suffix mismatch.
const loggedMisses = new Set<string>();

const getEntity = (hass: HomeAssistant | undefined, entityId?: string): HassEntity | undefined => {
  if (!entityId) return undefined;
  const entity = hass?.states[entityId];
  if (!entity && hass && !loggedMisses.has(entityId)) {
    loggedMisses.add(entityId);
    log('entity not found in hass.states:', entityId);
  }
  return entity;
};

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

// PrusaLink reports absolute ISO timestamps (`_print_start`/`_print_finish`)
// that we diff against now, rather than a live seconds count.
const resolveElapsedSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const override = resolveOverride(hass, config, MonitoredCondition.Elapsed);
  if (override.value !== undefined) {
    return (Date.now() - Date.parse(String(override.value))) / 1000;
  }

  const start = getEntity(hass, `${config.base_entity}_print_start`)?.state;
  return start ? (Date.now() - Date.parse(start)) / 1000 : undefined;
};

const resolveRemainingSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const overrideValue = resolveOverride(hass, config, MonitoredCondition.Remaining).value
    ?? resolveOverride(hass, config, MonitoredCondition.ETA).value;
  if (overrideValue !== undefined) {
    return (Date.parse(String(overrideValue)) - Date.now()) / 1000;
  }

  const finish = getEntity(hass, `${config.base_entity}_print_finish`)?.state;
  return finish ? (Date.parse(finish) - Date.now()) / 1000 : undefined;
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
