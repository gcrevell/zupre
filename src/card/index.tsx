import { useConfig } from 'hooks';
import { FunctionComponent } from 'preact';
import { RoomRow } from './RoomRow';
import styles from './card.module.css';

export const Card: FunctionComponent = () => {
  const config = useConfig();

  return (
    <div className={styles.root}>
      {config && <RoomRow room={config} />}
    </div>
  );
};
