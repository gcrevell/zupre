import { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { Intensity } from './weatherFx';
import styles from './card.module.css';

type Props = {
  intensity: Intensity;
  isNight: boolean;
};

const COUNT_MAP: Record<Intensity, number> = { light: 3, normal: 5, heavy: 7 };

type Blob = {
  top: string;
  width: string;
  height: string;
  opacity: string;
  animationDuration: string;
  animationDelay: string;
};

// The `cloud_style: 'css'` alternative to <Clouds> (a canvas-drawn image
// sprite): a handful of blurred radial-gradient blobs drifting on a CSS
// keyframe. No canvas, no image weight — trades detail for near-zero cost.
export const CssClouds: FunctionComponent<Props> = ({ intensity, isNight }) => {
  const blobs = useMemo<Blob[]>(() => {
    const count = COUNT_MAP[intensity] ?? 5;
    return Array.from({ length: count }, () => ({
      top: `${(Math.random() * 60).toFixed(1)}%`,
      width: `${(140 + Math.random() * 160).toFixed(0)}px`,
      height: `${(60 + Math.random() * 60).toFixed(0)}px`,
      opacity: (0.25 + Math.random() * 0.3).toFixed(2),
      animationDuration: `${(40 + Math.random() * 40).toFixed(1)}s`,
      animationDelay: `-${(Math.random() * 40).toFixed(1)}s`,
    }));
  }, [intensity]);

  return (
    <div className={styles.cssClouds}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={isNight ? `${styles.cssCloud} ${styles.cssCloudNight}` : styles.cssCloud}
          style={blob}
        />
      ))}
    </div>
  );
};
