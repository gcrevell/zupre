import { FunctionComponent } from 'preact';
import { useEntity, useHass } from 'hooks';
import { Config } from '../types';
import { isActiveJobStatus } from './sensors';
import styles from './card.module.css';

type Props = {
  config: Config;
  status: string;
  expanded: boolean;
  onToggleExpanded: () => void;
};

// PrusaLink's full canonical status vocabulary — every value the base
// entity is documented to report, so nothing falls through to the generic
// fallback color unless it's a genuinely unrecognized/future status.
const STATUS_COLORS: Record<string, string> = {
  idle: '#00bcd4',
  ready: '#00bcd4',
  busy: '#ffc107',
  printing: '#4caf50',
  paused: '#ffc107',
  attention: '#ff7043',
  finished: '#26a69a',
  stopped: '#9e9e9e',
  error: '#f44336',
  unknown: '#f44336',
};

export const Header: FunctionComponent<Props> = ({
  config, status, expanded, onToggleExpanded,
}) => {
  const hass = useHass();
  const power = useEntity(config.power_entity ?? '');
  const light = useEntity(config.light_entity ?? '');
  const powerOn = power?.state === 'on';
  const lightOn = light?.state === 'on';

  const toggle = (entity?: string) => (event: MouseEvent) => {
    event.stopPropagation();
    if (entity) hass?.callService('homeassistant', 'toggle', { entity_id: entity });
  };

  const statusColor = STATUS_COLORS[status.toLowerCase()] ?? '#ffc107';
  // Hidden rather than disabled during any in-progress job (Printing,
  // Paused, Attention, Busy — not just literal "Printing"): a smart plug cut
  // loses the job (and can damage the printer) whether or not it's actively
  // moving right now, so there's no safe "allow but discourage" state for
  // this button — only remove the temptation.
  const showPower = config.power_entity && !isActiveJobStatus(status);

  return (
    <div className={styles.header}>
      {showPower ? (
        <button
          type="button"
          className={styles.iconBtn}
          aria-pressed={powerOn}
          aria-label="Toggle power"
          onClick={toggle(config.power_entity)}
        >
          <ha-icon icon="mdi:power" />
        </button>
      ) : <div className={styles.iconBtnSpacer} />}

      <button
        type="button"
        className={styles.nameStatus}
        onClick={onToggleExpanded}
        aria-expanded={expanded}
      >
        <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
        <span className={styles.headerText}>{config.name || '(no name)'}</span>
      </button>

      {config.light_entity ? (
        <button
          type="button"
          className={styles.iconBtn}
          aria-pressed={lightOn}
          aria-label="Toggle light"
          onClick={toggle(config.light_entity)}
        >
          <ha-icon icon={lightOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'} />
        </button>
      ) : <div className={styles.iconBtnSpacer} />}
    </div>
  );
};
