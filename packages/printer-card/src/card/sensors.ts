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

export type StatusAction = { suffix: string; label: string; icon: string };

type StatusMeta = {
  color: string;
  // Whether this status represents an in-progress job — used to decide
  // whether print-control buttons apply, whether the card should
  // auto-expand, whether the printer graphic shows the idle icon, and
  // whether the power button is hidden (cutting power mid-job loses the
  // print and can damage the printer, whether or not it's actively moving
  // right now).
  active: boolean;
  actions: StatusAction[];
};

// Single source of truth for PrusaLink's full canonical status vocabulary —
// Header (color) and Actions (buttons) both derive from this instead of
// keeping their own independent status->behavior maps, so a status that's
// missing or mistyped here fails the same way everywhere rather than
// silently falling back to different defaults in different components.
const STATUS_META: Record<string, StatusMeta> = {
  idle: { color: '#00bcd4', active: false, actions: [] },
  ready: { color: '#00bcd4', active: false, actions: [] },
  busy: {
    color: '#ffc107',
    active: true,
    actions: [{ suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' }],
  },
  printing: {
    color: '#4caf50',
    active: true,
    actions: [
      { suffix: 'pause_job', label: 'Pause', icon: 'mdi:pause' },
      { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
    ],
  },
  // A plain user-initiated pause offers Resume...
  paused: {
    color: '#ffc107',
    active: true,
    actions: [
      { suffix: 'resume_job', label: 'Resume', icon: 'mdi:play' },
      { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
    ],
  },
  // ...while a print blocked on something (filament runout, MMU, etc.)
  // surfaces as Attention and offers Continue instead.
  attention: {
    color: '#ff7043',
    active: true,
    actions: [
      { suffix: 'continue_job', label: 'Continue', icon: 'mdi:play' },
      { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
    ],
  },
  finished: { color: '#26a69a', active: false, actions: [] },
  stopped: { color: '#9e9e9e', active: false, actions: [] },
  error: { color: '#f44336', active: false, actions: [] },
  // Not a real PrusaLink status — our own fallback when the base entity is
  // missing (see resolveStatus above).
  unknown: { color: '#f44336', active: false, actions: [] },
};

const FALLBACK_STATUS_META: StatusMeta = { color: '#ffc107', active: false, actions: [] };

const statusMeta = (status: string): StatusMeta => (
  STATUS_META[status.toLowerCase()] ?? FALLBACK_STATUS_META
);

export const statusColor = (status: string): string => statusMeta(status).color;

export const statusActions = (status: string): StatusAction[] => statusMeta(status).actions;

export const isActiveJobStatus = (status: string): boolean => statusMeta(status).active;

export const resolvePercent = (hass: HomeAssistant | undefined, config: Config): number => {
  const overrideValue = resolveOverride(hass, config, 'Progress').value;
  const value = overrideValue ?? getEntity(hass, `${config.base_entity}_progress`)?.state;
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

// A bare number string ("300", "5400") isn't rejected by Date.parse — it
// silently resolves to a bogus date (year 300, year 5400, ...) rather than
// NaN, so parseTimestamp alone can't tell "unparseable" apart from
// "technically parses to nonsense." A `sensors:` override for Elapsed/
// Remaining/ETA can legitimately point at either an absolute timestamp
// entity (matching PrusaLink's own convention) or a plain duration-in-
// seconds entity (e.g. an OctoPrint-style "time remaining" sensor), so
// numeric-looking values are treated as a duration directly instead of
// being handed to Date.parse at all.
const isPlainNumber = (value: string): boolean => /^-?\d+(\.\d+)?$/.test(value.trim());

// PrusaLink reports absolute ISO timestamps (`_print_start`/`_print_finish`)
// that we diff against now, rather than a live seconds count.
const resolveElapsedSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const override = resolveOverride(hass, config, MonitoredCondition.Elapsed);
  if (override.value !== undefined) {
    const raw = String(override.value);
    if (isPlainNumber(raw)) return Number(raw);
    const parsed = parseTimestamp(raw);
    return parsed !== undefined ? (Date.now() - parsed) / 1000 : undefined;
  }

  const start = parseTimestamp(getEntity(hass, `${config.base_entity}_print_start`)?.state);
  return start !== undefined ? (Date.now() - start) / 1000 : undefined;
};

const resolveRemainingSeconds = (hass: HomeAssistant | undefined, config: Config): number | undefined => {
  const overrideValue = resolveOverride(hass, config, MonitoredCondition.Remaining).value
    ?? resolveOverride(hass, config, MonitoredCondition.ETA).value;
  if (overrideValue !== undefined) {
    const raw = String(overrideValue);
    if (isPlainNumber(raw)) return Number(raw);
    const parsed = parseTimestamp(raw);
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

// Plain `${base_entity}${suffix}` string stats (no time/temperature math),
// still allowing a `sensors:` override to take precedence.
const resolveSimpleStat = (
  hass: HomeAssistant | undefined,
  config: Config,
  condition: MonitoredCondition,
  suffix: string,
  name: string,
): Stat => {
  const override = resolveOverride(hass, config, condition);
  const value = override.value ?? getEntity(hass, `${config.base_entity}${suffix}`)?.state;
  return {
    key: condition,
    name: override.name ?? name,
    value: value !== undefined ? String(value) : '—',
  };
};

const resolveStat = (
  hass: HomeAssistant | undefined,
  config: Config,
  condition: MonitoredCondition | string,
  precomputedStatus?: string,
): Stat => {
  switch (condition) {
    case MonitoredCondition.Status:
      return { key: condition, name: 'Status', value: precomputedStatus ?? resolveStatus(hass, config) };

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

    case MonitoredCondition.FileName:
      return resolveSimpleStat(hass, config, condition, '_filename', 'File');

    case MonitoredCondition.Material:
      return resolveSimpleStat(hass, config, condition, '_material', 'Material');

    case MonitoredCondition.PrintSpeed: {
      const stat = resolveSimpleStat(hass, config, condition, '_print_speed', 'Speed');
      return stat.value === '—' ? stat : { ...stat, value: `${stat.value}%` };
    }

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

// `precomputedStatus` lets a caller that's already resolved status for its
// own purposes (e.g. the header) pass it through instead of resolving it
// again here — only used for the Status condition.
export const resolveStats = (
  hass: HomeAssistant | undefined,
  config: Config,
  precomputedStatus?: string,
): Stat[] => (
  (config.monitored ?? []).map((condition) => resolveStat(hass, config, condition, precomputedStatus))
);
