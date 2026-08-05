import { FunctionComponent } from 'preact';
import { HomeAssistant } from 'custom-card-helpers';
import { ForecastAttributes, useElementWidth } from 'hooks';
import { getWeatherIcon } from './weatherIcon';
import { formatLabel, formatTemp, isNight as resolveIsNight } from './forecast';
import styles from './card.module.css';

type Props = {
  hass?: HomeAssistant;
  entityId?: string;
  items: ForecastAttributes[];
  isHourly: boolean;
  minColumnWidth: number;
};

// Column count truncates to whatever fits at minColumnWidth rather than
// wrapping (CSS repeat(auto-fit, minmax(...)) would wrap overflow items to a
// second row, not the truncate-to-strip behavior being rebuilt here).
export const ForecastRow: FunctionComponent<Props> = ({
  hass, entityId, items, isHourly, minColumnWidth,
}) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const maxCols = width > 0 ? Math.max(1, Math.floor(width / minColumnWidth)) : items.length;
  const visible = items.slice(0, Math.max(1, Math.min(items.length, maxCols)));

  return (
    <div
      ref={ref}
      className={styles.forecastRow}
      style={{ gridTemplateColumns: `repeat(${visible.length || 1}, 1fr)` }}
    >
      {visible.map((item) => {
        const night = resolveIsNight(hass, entityId, item);
        return (
          <div key={item.datetime} className={styles.forecastDay}>
            <div className={styles.dayLabel}>{formatLabel(hass, item.datetime, isHourly)}</div>
            <ha-icon icon={getWeatherIcon(item.condition ?? '', night)} />
            <div className={styles.temps}>
              <div className={styles.hi}>{formatTemp(hass, item.temperature)}</div>
              {!isHourly && <div className={styles.lo}>{formatTemp(hass, item.templow)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
