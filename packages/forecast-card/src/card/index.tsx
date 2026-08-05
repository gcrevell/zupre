import { FunctionComponent } from 'preact';
import { useConfig, useForecast, useHass } from 'hooks';
import { normalizeForecast, isNight as resolveIsNight } from './forecast';
import { Background } from './Background';
import { Header } from './Header';
import { ForecastSection } from './ForecastSection';
import styles from './card.module.css';

export const Card: FunctionComponent = () => {
  const config = useConfig();
  const hass = useHass();

  const mode = config?.forecast_type ?? 'daily';
  const wantsDaily = mode === 'daily' || mode === 'twice_daily' || mode === 'both';
  const wantsHourly = mode === 'hourly' || mode === 'both';
  const dailyForecastType = mode === 'twice_daily' ? 'twice_daily' : 'daily';

  // Both calls run unconditionally (rules-of-hooks) — the hook itself
  // no-ops when either argument is undefined, so 'both' mode is the only
  // case where both actually subscribe.
  const { forecast: dailyRaw } = useForecast(
    wantsDaily ? config?.entity : undefined,
    wantsDaily ? dailyForecastType : undefined,
  );
  const { forecast: hourlyRaw } = useForecast(
    wantsHourly ? config?.entity : undefined,
    wantsHourly ? 'hourly' : undefined,
  );

  if (!config || !config.entity) return null;

  const entity = hass?.states[config.entity];
  const maxItems = config.max_items ?? 5;
  const maxHourly = config.max_hourly ?? 8;
  const minColumnWidth = config.min_column_width ?? 50;
  const cloudStyle = config.cloud_style ?? 'image';
  const showHeader = config.show_header ?? true;
  const showForecast = config.show_forecast ?? true;

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const animationsEnabled = !config.disable_animations && !prefersReducedMotion;

  const dailyItems = wantsDaily ? normalizeForecast(dailyRaw, dailyForecastType, maxItems) : [];
  const hourlyItems = wantsHourly ? normalizeForecast(hourlyRaw, 'hourly', maxHourly) : [];

  const leadItem = hourlyItems[0] ?? dailyItems[0];
  const night = resolveIsNight(hass, config.entity, leadItem);

  const condition = entity?.state ?? '';
  const windSpeed = entity?.attributes.wind_speed as number | undefined;
  const windBearing = entity?.attributes.wind_bearing as number | undefined;
  const precipitation = entity?.attributes.precipitation as number | undefined;

  const openMoreInfo = (event: MouseEvent) => {
    (event.currentTarget as HTMLElement).dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId: config.entity },
      bubbles: true,
      composed: true,
    }));
  };

  const rootClass = [
    styles.root,
    config.square && styles.square,
    !config.disable_dynamic_background && styles.withBackground,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="button"
      tabIndex={0}
      onClick={openMoreInfo}
      onKeyDown={(event) => event.key === 'Enter' && openMoreInfo(event as unknown as MouseEvent)}
    >
      {!config.disable_dynamic_background && (
        <Background
          condition={condition}
          isNight={night}
          windSpeed={windSpeed}
          windBearing={windBearing}
          precipitation={precipitation}
          animationsEnabled={animationsEnabled}
          cloudStyle={cloudStyle}
        />
      )}
      <div className={styles.content}>
        {showHeader && (
          <Header
            hass={hass}
            entity={entity}
            name={config.name}
            isNight={night}
            headerAttributes={config.header_attributes}
          />
        )}
        {showForecast && (
          <div className={styles.forecastGrid}>
            {mode === 'both' ? (
              <>
                <ForecastSection
                  label="Hourly"
                  hass={hass}
                  entityId={config.entity}
                  items={hourlyItems}
                  isHourly
                  minColumnWidth={minColumnWidth}
                />
                <ForecastSection
                  label="Daily"
                  hass={hass}
                  entityId={config.entity}
                  items={dailyItems}
                  isHourly={false}
                  minColumnWidth={minColumnWidth}
                />
              </>
            ) : (
              <ForecastSection
                hass={hass}
                entityId={config.entity}
                items={mode === 'hourly' ? hourlyItems : dailyItems}
                isHourly={mode === 'hourly'}
                minColumnWidth={minColumnWidth}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
