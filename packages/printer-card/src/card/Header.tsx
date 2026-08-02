import { FunctionComponent } from 'preact';
import { useEntity, useHass } from 'hooks';
import { Config } from '../types';
import styles from './card.module.css';

type Props = {
  config: Config;
  status: string;
  expanded: boolean;
  onToggleExpanded: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  printing: '#4caf50',
  unknown: '#f44336',
  operational: '#00bcd4',
  idle: '#00bcd4',
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
  // Hidden rather than disabled while printing: a smart plug cut mid-print
  // loses the job (and can damage the printer), so there's no safe "allow
  // but discourage" state for this button — only remove the temptation.
  const showPower = config.power_entity && status.toLowerCase() !== 'printing';

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
