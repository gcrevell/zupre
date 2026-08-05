import { FunctionComponent } from 'preact';
import { HomeAssistant } from 'custom-card-helpers';
import { ForecastAttributes } from 'hooks';
import { ForecastRow } from './ForecastRow';
import styles from './card.module.css';

type Props = {
  label?: string;
  hass?: HomeAssistant;
  entityId?: string;
  items: ForecastAttributes[];
  isHourly: boolean;
  minColumnWidth: number;
};

// The optional label is only used in `forecast_type: 'both'` mode, to tell
// the stacked hourly/daily rows apart.
export const ForecastSection: FunctionComponent<Props> = ({
  label, hass, entityId, items, isHourly, minColumnWidth,
}) => {
  if (!items.length) return null;

  return (
    <div className={styles.forecastSection}>
      {label && <div className={styles.forecastSectionLabel}>{label}</div>}
      <ForecastRow
        hass={hass}
        entityId={entityId}
        items={items}
        isHourly={isHourly}
        minColumnWidth={minColumnWidth}
      />
    </div>
  );
};
