import { FunctionComponent } from 'preact';
import { useHass } from 'hooks';
import styles from './card.module.css';

type Action = { suffix: string; label: string; icon: string };

// PrusaLink's job-control buttons apply differently depending on *why* the
// job is paused: a plain user-initiated pause offers Resume, while a print
// blocked on something (filament runout, MMU, etc.) surfaces as "Attention"
// and offers Continue instead. Busy (a transient in-between state) only
// offers Cancel.
const ACTIONS_BY_STATUS: Record<string, Action[]> = {
  printing: [
    { suffix: 'pause_job', label: 'Pause', icon: 'mdi:pause' },
    { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
  ],
  paused: [
    { suffix: 'resume_job', label: 'Resume', icon: 'mdi:play' },
    { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
  ],
  attention: [
    { suffix: 'continue_job', label: 'Continue', icon: 'mdi:play' },
    { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
  ],
  busy: [
    { suffix: 'cancel_job', label: 'Cancel', icon: 'mdi:stop' },
  ],
};

type Props = {
  baseEntity?: string;
  status: string;
};

// PrusaLink's job-control buttons live at `button.<name>_<verb>_job`,
// derived from base_entity (`sensor.<name>`) the same way sensor suffixes
// are — there's no separate config field for each one.
export const Actions: FunctionComponent<Props> = ({ baseEntity, status }) => {
  const hass = useHass();
  const actions = ACTIONS_BY_STATUS[status.toLowerCase()];

  if (!baseEntity || !actions?.length) return null;

  const name = baseEntity.slice(baseEntity.indexOf('.') + 1);

  const press = (suffix: string) => (event: MouseEvent) => {
    event.stopPropagation();
    hass?.callService('button', 'press', { entity_id: `button.${name}_${suffix}` });
  };

  return (
    <div className={styles.actions}>
      {actions.map(({ suffix, label, icon }) => (
        <button key={suffix} type="button" className={styles.actionBtn} onClick={press(suffix)}>
          <ha-icon icon={icon} />
          {label}
        </button>
      ))}
    </div>
  );
};
