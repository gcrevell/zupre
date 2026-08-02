import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useEntity } from 'hooks';
import styles from './card.module.css';

type Props = {
  entity: string;
  visible: boolean;
  onClose: () => void;
};

// Polls the camera entity's `entity_picture` snapshot URL rather than pulling
// in a live stream element — this card only needs a "peek at the camera"
// overlay, not continuous video.
export const Camera: FunctionComponent<Props> = ({ entity, visible, onClose }) => {
  const camera = useEntity(entity);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(id);
  }, [visible]);

  const picture = camera?.attributes.entity_picture as string | undefined;
  if (!visible || !picture) return null;

  const src = `${picture}${picture.includes('?') ? '&' : '?'}t=${tick}`;

  return (
    <div
      className={styles.cameraOverlay}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && onClose()}
    >
      <img className={styles.cameraImage} src={src} alt="Printer camera" />
    </div>
  );
};
