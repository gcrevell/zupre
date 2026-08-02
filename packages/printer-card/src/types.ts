import { BaseConfig } from '@zupre/core';

export enum PrinterType {
  I3 = 'I3',
  Cantilever = 'Cantilever',
}

export enum PrinterTheme {
  Default = 'Default',
  Neumorphic = 'Neumorphic',
}

export enum MonitoredCondition {
  Status = 'Status',
  ETA = 'ETA',
  Elapsed = 'Elapsed',
  Remaining = 'Remaining',
  Hotend = 'Hotend',
  Bed = 'Bed',
  FileName = 'FileName',
  Material = 'Material',
  PrintSpeed = 'PrintSpeed',
}

export enum TemperatureUnit {
  C = 'C',
  F = 'F',
}

// Lets a YAML author point a condition at an arbitrary entity/attribute
// instead of the `${base_entity}${suffix}` convention below — e.g. hotend/bed
// temperatures, which HA's PrusaLink integration doesn't expose as separate
// `base_entity`-prefixed entities.
export type SensorOverride = {
  entity: string;
  attribute?: string;
  name?: string;
};

export type Printer = {
  base_entity?: string;
  name?: string;
  printer_type?: PrinterType;
  monitored?: (MonitoredCondition | string)[];
  theme?: PrinterTheme;
  font?: string;
  scale?: number;
  vertical?: boolean;
  round_temperature?: boolean;
  round_time?: boolean;
  temperature_unit?: TemperatureUnit;
  use_24hr?: boolean;
  light_entity?: string;
  power_entity?: string;
  camera_entity?: string;
  always_show?: boolean;
  sensors?: Record<string, SensorOverride>;
};

export type Config = Printer & BaseConfig;
