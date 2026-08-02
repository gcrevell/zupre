import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { FormSchema, HaForm } from '@zupre/core';
import { Config } from '../types';
import { Tabs } from './Tabs';
import { MonitoredField } from './MonitoredField';
import styles from './editor.module.css';

type Props = {
  config: Config;
  hass?: HomeAssistant;
  onChange: (config: Config) => void;
};

const LABELS: Record<string, string> = {
  name: 'Name',
  base_entity: 'Base entity prefix',
  theme: 'Theme',
  always_show: 'Always show (disable auto-collapse)',
  vertical: 'Vertical layout',
  scale: 'Graphic scale',
  font: 'Font',
  power_entity: 'Power switch entity (optional)',
  light_entity: 'Light entity (optional)',
  camera_entity: 'Camera entity (optional)',
  temperature_unit: 'Temperature unit',
  round_temperature: 'Round temperatures',
  round_time: 'Round durations',
  use_24hr: 'Use 24-hour time',
};

const computeLabel = (schema: FormSchema) => LABELS[schema.name as string] ?? (schema.name as string);

const GENERAL_SCHEMA: FormSchema[] = [{ name: 'name', selector: { text: {} } }];
const BASE_ENTITY_SCHEMA: FormSchema[] = [{ name: 'base_entity', selector: { text: {} } }];
// No printer_type field here: the graphic only ever renders the I3 style
// today (see PrinterGraphic), so exposing a Cantilever option in the editor
// would silently do nothing if picked. printer_type is still a valid YAML
// field for forward-compat, just not offered in the visual editor.
const THEME_SCHEMA: FormSchema[] = [
  {
    name: 'theme',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'Default', label: 'Default' },
          { value: 'Neumorphic', label: 'Neumorphic' },
        ],
      },
    },
  },
];
const DISPLAY_SCHEMA: FormSchema[] = [
  { name: 'always_show', selector: { boolean: {} } },
  { name: 'vertical', selector: { boolean: {} } },
  { name: 'scale', selector: { number: { mode: 'box', step: 0.1, min: 0.2, max: 3 } } },
  { name: 'font', selector: { text: {} } },
];

const ENTITIES_SCHEMA: FormSchema[] = [
  { name: 'power_entity', selector: { entity: {} } },
  { name: 'light_entity', selector: { entity: {} } },
  { name: 'camera_entity', selector: { entity: { domain: 'camera' } } },
];

const UNITS_SCHEMA: FormSchema[] = [
  {
    name: 'temperature_unit',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'C', label: 'Celsius' },
          { value: 'F', label: 'Fahrenheit' },
        ],
      },
    },
  },
  { name: 'round_temperature', selector: { boolean: {} } },
  { name: 'round_time', selector: { boolean: {} } },
  { name: 'use_24hr', selector: { boolean: {} } },
];

const TABS = ['General', 'Entities', 'Monitored'];

export const Editor: FunctionComponent<Props> = ({ config, hass, onChange }) => {
  const [tab, setTab] = useState(0);

  const generalData = useMemo(() => ({ name: config.name ?? '' }), [config.name]);
  const baseEntityData = useMemo(
    () => ({ base_entity: config.base_entity ?? '' }),
    [config.base_entity],
  );
  const themeData = useMemo(() => ({ theme: config.theme ?? 'Default' }), [config.theme]);
  const displayData = useMemo(() => ({
    always_show: config.always_show ?? false,
    vertical: config.vertical ?? false,
    scale: config.scale ?? 1,
    font: config.font ?? '',
  }), [config.always_show, config.vertical, config.scale, config.font]);
  const entitiesData = useMemo(() => ({
    power_entity: config.power_entity ?? '',
    light_entity: config.light_entity ?? '',
    camera_entity: config.camera_entity ?? '',
  }), [config.power_entity, config.light_entity, config.camera_entity]);
  const unitsData = useMemo(() => ({
    temperature_unit: config.temperature_unit ?? 'C',
    round_temperature: config.round_temperature ?? false,
    round_time: config.round_time ?? false,
    use_24hr: config.use_24hr ?? false,
  }), [config.temperature_unit, config.round_temperature, config.round_time, config.use_24hr]);

  const merge = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <div className={styles.root}>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 0 && (
        <div className={styles.tabPanel}>
          <div className={styles.fields}>
            <HaForm
              hass={hass}
              data={generalData}
              schema={GENERAL_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ name: String(value.name ?? '') })}
            />
            <HaForm
              hass={hass}
              data={baseEntityData}
              schema={BASE_ENTITY_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ base_entity: String(value.base_entity ?? '') })}
            />
            <HaForm
              hass={hass}
              data={themeData}
              schema={THEME_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ theme: value.theme as Config['theme'] })}
            />
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Display</div>
            <HaForm
              hass={hass}
              data={displayData}
              schema={DISPLAY_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                always_show: Boolean(value.always_show),
                vertical: Boolean(value.vertical),
                scale: Number(value.scale) || 1,
                font: String(value.font ?? '') || undefined,
              })}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className={styles.tabPanel}>
          <div className={styles.intro}>
            <div className={styles.introTitle}>Entities</div>
            <div className={styles.introSubtitle}>
              Optional switches and camera shown around the printer graphic.
            </div>
          </div>
          <HaForm
            hass={hass}
            data={entitiesData}
            schema={ENTITIES_SCHEMA}
            computeLabel={computeLabel}
            onChange={(value) => merge({
              power_entity: String(value.power_entity ?? '') || undefined,
              light_entity: String(value.light_entity ?? '') || undefined,
              camera_entity: String(value.camera_entity ?? '') || undefined,
            })}
          />
        </div>
      )}

      {tab === 2 && (
        <div className={styles.tabPanel}>
          <div className={styles.intro}>
            <div className={styles.introTitle}>Monitored</div>
            <div className={styles.introSubtitle}>
              Stats shown next to the printer graphic. PrusaLink doesn&apos;t expose
              Hotend/Bed as separate entities — point those at a real entity with a
              YAML
              {' '}
              <code>sensors</code>
              {' '}
              map.
            </div>
          </div>
          <MonitoredField
            monitored={config.monitored ?? []}
            onChange={(monitored) => merge({ monitored: monitored.length ? monitored : undefined })}
          />
          <div className={styles.group}>
            <div className={styles.groupTitle}>Units</div>
            <HaForm
              hass={hass}
              data={unitsData}
              schema={UNITS_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                temperature_unit: value.temperature_unit as Config['temperature_unit'],
                round_temperature: Boolean(value.round_temperature),
                round_time: Boolean(value.round_time),
                use_24hr: Boolean(value.use_24hr),
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
