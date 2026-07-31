import { FunctionComponent } from 'preact';
import {
  useCallback, useEffect, useRef, useState,
} from 'preact/hooks';
import { RoomAction } from 'types';
import { ActionButton } from './ActionButton';
import styles from './card.module.css';

const AUTO_CLOSE_MS = 5000;

type Props = {
  actions: RoomAction[];
  onCollapse?: () => void;
};

export const ActionMenu: FunctionComponent<Props> = ({ actions, onCollapse }) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>();
  const wasOpen = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (open) scheduleClose();
    else clearCloseTimer();
    return clearCloseTimer;
  }, [open, scheduleClose, clearCloseTimer]);

  useEffect(() => {
    if (wasOpen.current && !open) onCollapse?.();
    wasOpen.current = open;
  }, [open, onCollapse]);

  return (
    <div className={styles.menu}>
      <div
        className={`${styles.menuItems} ${open ? styles.menuItemsOpen : ''}`}
        onClick={scheduleClose}
      >
        <div className={styles.menuBackdrop} />
        {actions.map((action) => (
          <ActionButton key={action.script} action={action} onAction={scheduleClose} />
        ))}
      </div>
      <button
        type="button"
        className={`${styles.menuTrigger} ${open ? styles.menuTriggerOpen : ''}`}
        aria-label={open ? 'Close menu' : 'More actions'}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className={styles.menuDot} />
        <span className={styles.menuDot} />
        <span className={styles.menuDot} />
      </button>
    </div>
  );
};
