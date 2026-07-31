import { FunctionComponent } from 'preact';
import { useEntity, useHass } from 'hooks';
import { RoomAction } from 'types';
import styles from './card.module.css';

type Props = {
  action: RoomAction;
};

export const ActionButton: FunctionComponent<Props> = ({ action }) => {
  const hass = useHass();
  const enabled = useEntity(action.enabledEntity);
  const script = useEntity(action.script);
  const isEnabled = enabled?.state === 'on';

  const handleClick = () => {
    hass?.callService('script', 'turn_on', { entity_id: action.script, variables: action.data });
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
