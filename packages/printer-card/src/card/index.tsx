import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useConfig, useHass } from 'hooks';
import {
  isActiveJobStatus, resolvePercent, resolveStats, resolveStatus,
} from './sensors';
import { Header } from './Header';
import { PrinterGraphic } from './PrinterGraphic';
import { Stats } from './Stats';
import { Camera } from './Camera';
import { Actions } from './Actions';
import styles from './card.module.css';

export const Card: FunctionComponent = () => {
  const config = useConfig();
  const hass = useHass();
  // undefined = "no manual override yet", so the card still auto-collapses/
  // expands with print state until the user taps the header themselves.
  const [expandedOverride, setExpandedOverride] = useState<boolean | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);

  // Plain derived consts, not useMemo: `hass` gets a new object reference
  // on every single `set hass()` call HA makes — i.e. on every state change
  // anywhere in the system, not just this printer's entities (see this
  // repo's own architecture notes) — so a memo keyed on [hass, config]
  // would invalidate on effectively every render anyway.
  const status = config ? resolveStatus(hass, config) : 'unknown';
  // `printing` gates the graphic's nozzle-sweep animation specifically —
  // it shouldn't sweep while Paused/Attention/Busy even though those still
  // count as an active job for expand/idle-icon purposes.
  const printing = status.toLowerCase() === 'printing';
  const active = isActiveJobStatus(status);
  const percent = config ? resolvePercent(hass, config) : 0;
  const stats = config ? resolveStats(hass, config, status) : [];

  if (!config) return null;

  const expanded = expandedOverride ?? (config.always_show || active);
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
        <div className={styles.contentInner}>
          <div className={styles.mainRow} style={config.vertical ? { flexDirection: 'column' } : undefined}>
            <button
              type="button"
              className={styles.graphicButton}
              onClick={() => config.camera_entity && setShowCamera(true)}
              aria-label={config.camera_entity ? 'Show camera' : 'Printer status'}
            >
              <PrinterGraphic progress={percent} printing={printing} active={active} scale={config.scale} />
            </button>
            <Stats stats={stats} percent={percent} showPercent={!config.vertical} />
          </div>
          <Actions baseEntity={config.base_entity} status={status} />
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
