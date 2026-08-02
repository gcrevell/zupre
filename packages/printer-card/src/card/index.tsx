import { FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useConfig, useHass } from 'hooks';
import { resolvePercent, resolveStats, resolveStatus } from './sensors';
import { Header } from './Header';
import { PrinterGraphic } from './PrinterGraphic';
import { Stats } from './Stats';
import { Camera } from './Camera';
import styles from './card.module.css';

export const Card: FunctionComponent = () => {
  const config = useConfig();
  const hass = useHass();
  // undefined = "no manual override yet", so the card still auto-collapses/
  // expands with print state until the user taps the header themselves.
  const [expandedOverride, setExpandedOverride] = useState<boolean | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);

  const status = config ? resolveStatus(hass, config) : 'unknown';
  const printing = status.toLowerCase() === 'printing';
  const percent = config ? resolvePercent(hass, config) : 0;
  const stats = useMemo(
    () => (config ? resolveStats(hass, config) : []),
    [hass, config],
  );

  if (!config) return null;

  const expanded = expandedOverride ?? (config.always_show || printing);
  const rootClass = config.theme === 'Neumorphic' ? `${styles.root} ${styles.neumorphic}` : styles.root;

  return (
    <div className={rootClass} style={{ fontFamily: config.font || 'sans-serif' }}>
      <Header
        config={config}
        status={status}
        expanded={expanded}
        onToggleExpanded={() => setExpandedOverride(!expanded)}
      />
      <div className={expanded ? `${styles.content} ${styles.contentOpen}` : styles.content}>
        <div className={styles.contentInner} style={config.vertical ? { flexDirection: 'column' } : undefined}>
          <button
            type="button"
            className={styles.graphicButton}
            onClick={() => config.camera_entity && setShowCamera(true)}
            aria-label={config.camera_entity ? 'Show camera' : 'Printer status'}
          >
            <PrinterGraphic progress={percent} printing={printing} scale={config.scale} />
          </button>
          <Stats stats={stats} percent={percent} showPercent={!config.vertical} />
        </div>
      </div>
      {config.camera_entity && (
        <Camera
          entity={config.camera_entity}
          visible={showCamera}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
