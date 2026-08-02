import { FunctionComponent } from 'preact';
import { useHass } from 'hooks';
import { statusActions } from './sensors';
import styles from './card.module.css';

type Props = {
  baseEntity?: string;
  status: string;
};

// PrusaLink's job-control buttons live at `button.<name>_<verb>_job`,
// derived from base_entity (`sensor.<name>`) the same way sensor suffixes
// are — there's no separate config field for each one.
export const Actions: FunctionComponent<Props> = ({ baseEntity, status }) => {
  const hass = useHass();
  const actions = statusActions(status);
  const domainSeparator = baseEntity?.indexOf('.') ?? -1;

  // A base_entity without a domain (e.g. missing the "sensor." prefix) is a
  // config error — bail rather than silently deriving a button entity id
  // from the unmodified string.
  if (!baseEntity || domainSeparator === -1 || !actions.length) return null;

  const name = baseEntity.slice(domainSeparator + 1);

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
