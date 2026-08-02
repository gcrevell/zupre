import { HomeAssistant } from 'custom-card-helpers';
import { Config, MonitoredCondition } from '../types';
import { resolvePercent, resolveStats, resolveStatus } from './sensors';

type FakeState = { state: string; attributes?: Record<string, unknown> };

const fakeHass = (states: Record<string, FakeState>): HomeAssistant => (
  { states } as unknown as HomeAssistant
);

const baseConfig: Config = {
  type: 'custom:printer-card',
  base_entity: 'sensor.printer',
};

describe('resolveStatus', () => {
  it('reads the base entity\'s own state (PrusaLink has no status sub-entity)', () => {
    const hass = fakeHass({ 'sensor.printer': { state: 'Printing' } });
    expect(resolveStatus(hass, baseConfig)).toBe('Printing');
  });

  it('falls back to "unknown" when the entity is missing', () => {
    expect(resolveStatus(fakeHass({}), baseConfig)).toBe('unknown');
  });

  it('prefers a sensors.Status override over the base entity', () => {
    const hass = fakeHass({
      'sensor.printer': { state: 'Printing' },
      'sensor.custom_status': { state: 'Paused' },
    });
    const config: Config = {
      ...baseConfig,
      sensors: { Status: { entity: 'sensor.custom_status' } },
    };
    expect(resolveStatus(hass, config)).toBe('Paused');
  });

  it('reads an override attribute when one is given', () => {
    const hass = fakeHass({
      'sensor.octoprint_job': { state: 'idle', attributes: { display_state: 'Paused' } },
    });
    const config: Config = {
      ...baseConfig,
      sensors: { Status: { entity: 'sensor.octoprint_job', attribute: 'display_state' } },
    };
    expect(resolveStatus(hass, config)).toBe('Paused');
  });
});

describe('resolvePercent', () => {
  it('reads `${base_entity}_progress`', () => {
    const hass = fakeHass({ 'sensor.printer_progress': { state: '42' } });
    expect(resolvePercent(hass, baseConfig)).toBe(42);
  });

  it('defaults to 0 when missing or non-numeric', () => {
    expect(resolvePercent(fakeHass({}), baseConfig)).toBe(0);
    const hass = fakeHass({ 'sensor.printer_progress': { state: 'unknown' } });
    expect(resolvePercent(hass, baseConfig)).toBe(0);
  });

  it('prefers a Progress override, checking both cases', () => {
    const hass = fakeHass({ 'sensor.custom_progress': { state: '77' } });
    const config: Config = {
      ...baseConfig,
      sensors: { progress: { entity: 'sensor.custom_progress' } },
    };
    expect(resolvePercent(hass, config)).toBe(77);
  });
});

describe('resolveStats time fields', () => {
  const NOW = new Date('2024-01-01T12:00:00.000Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('computes Elapsed/Remaining from print_start/print_finish timestamps', () => {
    const hass = fakeHass({
      'sensor.printer_print_start': { state: new Date(NOW - 3661_000).toISOString() },
      'sensor.printer_print_finish': { state: new Date(NOW + 125_000).toISOString() },
    });
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.Elapsed, MonitoredCondition.Remaining],
    };

    expect(resolveStats(hass, config)).toEqual([
      { key: 'Elapsed', name: 'Elapsed', value: '1h 1m' },
      { key: 'Remaining', name: 'Remaining', value: '2m 5s' },
    ]);
  });

  it('formats ETA as a time of day derived from print_finish', () => {
    const hass = fakeHass({
      'sensor.printer_print_finish': { state: new Date(NOW + 125_000).toISOString() },
    });
    const config: Config = { ...baseConfig, monitored: [MonitoredCondition.ETA] };

    const [eta] = resolveStats(hass, config);
    // Not pinned to an exact string: formatTimeOfDay reads local wall-clock
    // hours/minutes, which depends on the machine's timezone. The point of
    // this test is that it's a real time, not the NaN regression below.
    expect(eta.value).toMatch(/^\d{1,2}:\d{2}( (AM|PM))?$/);
  });

  // Regression coverage: PrusaLink reports `_print_start`/`_print_finish` as
  // the string "unknown" (not missing) when there's no active job, and
  // Date.parse('unknown') is NaN — which used to leak through as literal
  // "NaN sec" / "NaN:NaN" instead of the dash placeholder.
  it('shows a dash instead of NaN when the timestamps are unparseable', () => {
    const hass = fakeHass({
      'sensor.printer_print_start': { state: 'unknown' },
      'sensor.printer_print_finish': { state: 'unavailable' },
    });
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.Elapsed, MonitoredCondition.Remaining, MonitoredCondition.ETA],
    };

    expect(resolveStats(hass, config).map((stat) => stat.value)).toEqual(['—', '—', '—']);
  });

  it('shows a dash when the timestamp entities are missing entirely', () => {
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.Elapsed, MonitoredCondition.Remaining],
    };

    expect(resolveStats(fakeHass({}), config).map((stat) => stat.value)).toEqual(['—', '—']);
  });
});

describe('resolveStats temperature fields', () => {
  it('reads Hotend/Bed only via sensors overrides (not exposed by PrusaLink directly)', () => {
    const hass = fakeHass({
      'sensor.nozzle_temp': { state: '210.5', attributes: { unit_of_measurement: '°C' } },
    });
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.Hotend],
      round_temperature: true,
      sensors: { Hotend: { entity: 'sensor.nozzle_temp' } },
    };

    expect(resolveStats(hass, config)).toEqual([
      { key: 'Hotend', name: 'Hotend', value: '211°C' },
    ]);
  });

  it('shows a dash when there is no override for a temperature condition', () => {
    const config: Config = { ...baseConfig, monitored: [MonitoredCondition.Bed] };
    expect(resolveStats(fakeHass({}), config)).toEqual([
      { key: 'Bed', name: 'Bed', value: '—' },
    ]);
  });
});

describe('resolveStats custom conditions', () => {
  it('falls through to a sensors override for unrecognized monitored keys', () => {
    const hass = fakeHass({ 'sensor.layer': { state: '42' } });
    const config: Config = {
      ...baseConfig,
      monitored: ['CurrentLayer'],
      sensors: { CurrentLayer: { entity: 'sensor.layer', name: 'Layer' } },
    };

    expect(resolveStats(hass, config)).toEqual([
      { key: 'CurrentLayer', name: 'Layer', value: '42' },
    ]);
  });

  it('shows a dash for an unrecognized key with no override', () => {
    const config: Config = { ...baseConfig, monitored: ['CurrentLayer'] };
    expect(resolveStats(fakeHass({}), config)).toEqual([
      { key: 'CurrentLayer', name: 'CurrentLayer', value: '—' },
    ]);
  });
});

describe('resolveStats FileName/Material/PrintSpeed', () => {
  it('reads FileName from `${base_entity}_filename`', () => {
    const hass = fakeHass({ 'sensor.printer_filename': { state: 'benchy.gcode' } });
    const config: Config = { ...baseConfig, monitored: [MonitoredCondition.FileName] };
    expect(resolveStats(hass, config)).toEqual([
      { key: 'FileName', name: 'File', value: 'benchy.gcode' },
    ]);
  });

  it('reads Material from `${base_entity}_material`', () => {
    const hass = fakeHass({ 'sensor.printer_material': { state: 'PLA' } });
    const config: Config = { ...baseConfig, monitored: [MonitoredCondition.Material] };
    expect(resolveStats(hass, config)).toEqual([
      { key: 'Material', name: 'Material', value: 'PLA' },
    ]);
  });

  it('reads PrintSpeed from `${base_entity}_print_speed` and appends a percent sign', () => {
    const hass = fakeHass({ 'sensor.printer_print_speed': { state: '100' } });
    const config: Config = { ...baseConfig, monitored: [MonitoredCondition.PrintSpeed] };
    expect(resolveStats(hass, config)).toEqual([
      { key: 'PrintSpeed', name: 'Speed', value: '100%' },
    ]);
  });

  it('shows a dash for these fields when the entity is missing, without appending a stray %', () => {
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.FileName, MonitoredCondition.Material, MonitoredCondition.PrintSpeed],
    };
    expect(resolveStats(fakeHass({}), config).map((stat) => stat.value)).toEqual(['—', '—', '—']);
  });

  it('prefers a sensors override for any of the three', () => {
    const hass = fakeHass({ 'sensor.custom_material': { state: 'PETG' } });
    const config: Config = {
      ...baseConfig,
      monitored: [MonitoredCondition.Material],
      sensors: { Material: { entity: 'sensor.custom_material' } },
    };
    expect(resolveStats(hass, config)).toEqual([
      { key: 'Material', name: 'Material', value: 'PETG' },
    ]);
  });
});
