import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { FormSchema, HaForm } from '@zupre/core';
import { Config } from '../types';
import { Tabs } from './Tabs';
import styles from './editor.module.css';

type Props = {
  config: Config;
  hass?: HomeAssistant;
  onChange: (config: Config) => void;
};

const LABELS: Record<string, string> = {
  entity: 'Weather entity',
  name: 'Name (optional)',
  forecast_type: 'Forecast type',
  max_items: 'Max daily/twice-daily items',
  max_hourly: 'Max hourly items',
  min_column_width: 'Min column width (px)',
  show_header: 'Show header',
  show_forecast: 'Show forecast',
  square: 'Square card',
  disable_animations: 'Disable animations',
  disable_dynamic_background: 'Disable dynamic background',
  cloud_style: 'Cloud style',
  header_attributes: 'Header attributes',
};

const computeLabel = (schema: FormSchema) => LABELS[schema.name as string] ?? (schema.name as string);

const ENTITY_SCHEMA: FormSchema[] = [{ name: 'entity', selector: { entity: { domain: 'weather' } } }];
const NAME_SCHEMA: FormSchema[] = [{ name: 'name', selector: { text: {} } }];

const FORECAST_TYPE_SCHEMA: FormSchema[] = [
  {
    name: 'forecast_type',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'hourly', label: 'Hourly' },
          { value: 'twice_daily', label: 'Twice daily' },
          { value: 'both', label: 'Both (hourly + daily)' },
        ],
      },
    },
  },
];

const FORECAST_LIMITS_SCHEMA: FormSchema[] = [
  { name: 'max_items', selector: { number: { mode: 'box', min: 1, max: 14 } } },
  { name: 'max_hourly', selector: { number: { mode: 'box', min: 1, max: 48 } } },
  { name: 'min_column_width', selector: { number: { mode: 'box', min: 30, max: 160 } } },
];

const HEADER_ATTRIBUTES_SCHEMA: FormSchema[] = [
  {
    name: 'header_attributes',
    selector: {
      select: {
        multiple: true,
        mode: 'list',
        options: [
          { value: 'humidity', label: 'Humidity' },
          { value: 'wind_speed', label: 'Wind speed' },
          { value: 'wind_bearing', label: 'Wind bearing' },
          { value: 'pressure', label: 'Pressure' },
          { value: 'visibility', label: 'Visibility' },
          { value: 'precipitation', label: 'Precipitation' },
          { value: 'precipitation_probability', label: 'Chance of precipitation' },
          { value: 'uv_index', label: 'UV index' },
          { value: 'dew_point', label: 'Dew point' },
        ],
      },
    },
  },
];

const LAYOUT_SCHEMA: FormSchema[] = [
  { name: 'show_header', selector: { boolean: {} } },
  { name: 'show_forecast', selector: { boolean: {} } },
  { name: 'square', selector: { boolean: {} } },
];

const ANIMATION_SCHEMA: FormSchema[] = [
  { name: 'disable_animations', selector: { boolean: {} } },
  { name: 'disable_dynamic_background', selector: { boolean: {} } },
];

const CLOUD_STYLE_SCHEMA: FormSchema[] = [
  {
    name: 'cloud_style',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'image', label: 'Image sprite' },
          { value: 'css', label: 'CSS (lightweight)' },
          { value: 'none', label: 'None' },
        ],
      },
    },
  },
];

const TABS = ['Entity', 'Forecast', 'Appearance'];

export const Editor: FunctionComponent<Props> = ({ config, hass, onChange }) => {
  const [tab, setTab] = useState(0);

  const entityData = useMemo(() => ({ entity: config.entity ?? '' }), [config.entity]);
  const nameData = useMemo(() => ({ name: config.name ?? '' }), [config.name]);
  const forecastTypeData = useMemo(
    () => ({ forecast_type: config.forecast_type ?? 'daily' }),
    [config.forecast_type],
  );
  const forecastLimitsData = useMemo(() => ({
    max_items: config.max_items ?? 5,
    max_hourly: config.max_hourly ?? 8,
    min_column_width: config.min_column_width ?? 50,
  }), [config.max_items, config.max_hourly, config.min_column_width]);
  const headerAttributesData = useMemo(
    () => ({ header_attributes: config.header_attributes ?? [] }),
    [config.header_attributes],
  );
  const layoutData = useMemo(() => ({
    show_header: config.show_header ?? true,
    show_forecast: config.show_forecast ?? true,
    square: config.square ?? false,
  }), [config.show_header, config.show_forecast, config.square]);
  const animationData = useMemo(() => ({
    disable_animations: config.disable_animations ?? false,
    disable_dynamic_background: config.disable_dynamic_background ?? false,
  }), [config.disable_animations, config.disable_dynamic_background]);
  const cloudStyleData = useMemo(
    () => ({ cloud_style: config.cloud_style ?? 'image' }),
    [config.cloud_style],
  );

  const merge = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <div className={styles.root}>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 0 && (
        <div className={styles.tabPanel}>
          <div className={styles.fields}>
            <HaForm
              hass={hass}
              data={entityData}
              schema={ENTITY_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ entity: String(value.entity ?? '') })}
            />
            <HaForm
              hass={hass}
              data={nameData}
              schema={NAME_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ name: String(value.name ?? '') || undefined })}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className={styles.tabPanel}>
          <div className={styles.fields}>
            <HaForm
              hass={hass}
              data={forecastTypeData}
              schema={FORECAST_TYPE_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ forecast_type: value.forecast_type as Config['forecast_type'] })}
            />
            <HaForm
              hass={hass}
              data={forecastLimitsData}
              schema={FORECAST_LIMITS_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                max_items: Number(value.max_items) || 5,
                max_hourly: Number(value.max_hourly) || 8,
                min_column_width: Number(value.min_column_width) || 50,
              })}
            />
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Header attributes</div>
            <HaForm
              hass={hass}
              data={headerAttributesData}
              schema={HEADER_ATTRIBUTES_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                header_attributes: (value.header_attributes as string[] | undefined)?.length
                  ? value.header_attributes as string[]
                  : undefined,
              })}
            />
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className={styles.tabPanel}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Layout</div>
            <HaForm
              hass={hass}
              data={layoutData}
              schema={LAYOUT_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                show_header: Boolean(value.show_header),
                show_forecast: Boolean(value.show_forecast),
                square: Boolean(value.square),
              })}
            />
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Animation</div>
            <HaForm
              hass={hass}
              data={animationData}
              schema={ANIMATION_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({
                disable_animations: Boolean(value.disable_animations),
                disable_dynamic_background: Boolean(value.disable_dynamic_background),
              })}
            />
            <HaForm
              hass={hass}
              data={cloudStyleData}
              schema={CLOUD_STYLE_SCHEMA}
              computeLabel={computeLabel}
              onChange={(value) => merge({ cloud_style: value.cloud_style as Config['cloud_style'] })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
