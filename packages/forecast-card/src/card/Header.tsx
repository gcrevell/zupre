import { FunctionComponent } from 'preact';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { getWeatherIcon } from './weatherIcon';
import { formatTemp } from './forecast';
import styles from './card.module.css';

type Props = {
  hass?: HomeAssistant;
  entity?: HassEntity;
  name?: string;
  isNight: boolean;
  headerAttributes?: string[];
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  humidity: 'Humidity',
  wind_speed: 'Wind',
  wind_bearing: 'Bearing',
  pressure: 'Pressure',
  visibility: 'Visibility',
  precipitation: 'Precipitation',
  precipitation_probability: 'Chance',
  uv_index: 'UV index',
  dew_point: 'Dew point',
  ozone: 'Ozone',
};

// Only these carry a companion `<key>_unit` attribute on the entity — the
// rest (humidity/wind_bearing as %/° or plain counts like uv_index) are
// handled directly in formatAttributeValue below.
const ATTRIBUTE_UNIT_KEYS: Record<string, string> = {
  wind_speed: 'wind_speed_unit',
  pressure: 'pressure_unit',
  visibility: 'visibility_unit',
  precipitation: 'precipitation_unit',
};

const humanizeCondition = (condition?: string): string => {
  if (!condition) return '';
  const base = condition.replace(/-night$/, '').replace(/-day$/, '').replace(/-/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
};

const formatAttributeValue = (entity: HassEntity, key: string): string => {
  const value = entity.attributes[key];
  if (value == null) return '—';
  if (key === 'humidity' || key === 'precipitation_probability') return `${value}%`;
  if (key === 'wind_bearing') return `${value}°`;
  const unitKey = ATTRIBUTE_UNIT_KEYS[key];
  const unit = unitKey ? entity.attributes[unitKey] : undefined;
  return unit ? `${value} ${unit}` : String(value);
};

export const Header: FunctionComponent<Props> = ({
  hass, entity, name, isNight, headerAttributes,
}) => {
  const condition = entity?.state;
  const temperature = entity?.attributes.temperature as number | undefined;

  return (
    <div className={styles.header}>
      <div className={styles.headerMain}>
        <ha-icon className={styles.headerIcon} icon={getWeatherIcon(condition ?? '', isNight)} />
        <div className={styles.headerText}>
          <div className={styles.headerName}>{name || entity?.attributes.friendly_name || ''}</div>
          <div className={styles.headerCondition}>{humanizeCondition(condition)}</div>
        </div>
        <div className={styles.headerTemp}>{formatTemp(hass, temperature)}</div>
      </div>
      {headerAttributes && headerAttributes.length > 0 && entity && (
        <div className={styles.headerAttributes}>
          {headerAttributes.map((key) => (
            <div key={key} className={styles.headerAttribute}>
              <span className={styles.headerAttributeLabel}>{ATTRIBUTE_LABELS[key] ?? key}</span>
              <span className={styles.headerAttributeValue}>{formatAttributeValue(entity, key)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
