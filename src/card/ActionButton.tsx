import { FunctionComponent } from 'preact';
import { useEntity, useHass } from 'hooks';
import { RoomAction } from 'types';
import styles from './card.module.css';

type Props = {
  action: RoomAction;
  onAction?: () => void;
};

export const ActionButton: FunctionComponent<Props> = ({ action, onAction }) => {
  const hass = useHass();
  const enabled = useEntity(action.enabled_entity);
  const script = useEntity(action.script);
  const isEnabled = enabled?.state === 'on';

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    hass?.callService('script', 'turn_on', { entity_id: action.script, variables: action.data });
    onAction?.();
  };

  return (
    <button
      type="button"
      className={`${styles.iconBtn} ${!isEnabled ? styles.iconBtnDisabled : ''}`}
      aria-disabled={!isEnabled}
      aria-label={script?.attributes.friendly_name ?? 'Room action'}
      onClick={handleClick}
    >
      <ha-icon icon={action.icon} />
    </button>
  );
};
