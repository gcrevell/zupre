import { FunctionComponent } from 'preact';
import {
  useCallback, useEffect, useRef, useState,
} from 'preact/hooks';
import { Room } from 'types';
import { ActionButton } from './ActionButton';
import { ActionMenu } from './ActionMenu';
import { BrightnessControl } from './BrightnessControl';
import { runIconAction } from './iconAction';
import styles from './card.module.css';

const BRIGHTNESS_LOCK_MS = 400;

type Props = {
  room: Room;
};

export const RoomRow: FunctionComponent<Props> = ({ room }) => {
  const [brightnessLocked, setBrightnessLocked] = useState(false);
  const unlockTimer = useRef<number>();

  const lockBrightness = useCallback(() => {
    window.clearTimeout(unlockTimer.current);
    setBrightnessLocked(true);
    unlockTimer.current = window.setTimeout(() => setBrightnessLocked(false), BRIGHTNESS_LOCK_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(unlockTimer.current), []);

  return (
    <div className={styles.room}>
      <button
        type="button"
        className={styles.roomIcon}
        disabled={!room.icon_action}
        aria-label={room.icon_action ? room.name : undefined}
        onClick={() => room.icon_action && runIconAction(room.icon_action)}
      >
        <ha-icon icon={room.icon} />
      </button>
      <div className={styles.roomMain}>
        <div className={styles.roomName}>{room.name}</div>
        {room.brightness_entity && (
          <BrightnessControl entity={room.brightness_entity} locked={brightnessLocked} />
        )}
      </div>
      <div className={styles.actionsRow}>
        {room.actions?.length === 1 && <ActionButton action={room.actions[0]} />}
        {room.actions && room.actions.length > 1 && (
          <ActionMenu actions={room.actions} onCollapse={lockBrightness} />
        )}
      </div>
    </div>
  );
};
