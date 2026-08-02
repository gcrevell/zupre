import { FunctionComponent } from 'preact';
import styles from './card.module.css';

type Props = {
  progress: number;
  printing: boolean;
  scale?: number;
};

// A stylized front-on view of a cartesian (I3-style) printer, built from
// plain positioned boxes rather than ported pixel geometry: the gantry rises
// as `progress` grows (mirroring the print head moving up the Z axis) and
// the build fill grows to match, with a CSS keyframe sweep standing in for
// the nozzle moving along X while printing.
export const PrinterGraphic: FunctionComponent<Props> = ({ progress, printing, scale }) => {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className={styles.printer} style={{ transform: `scale(${scale ?? 1})` }}>
      <div className={styles.frame}>
        <div className={styles.postLeft} />
        <div className={styles.postRight} />
        <div className={styles.topBar} />
        <div className={styles.baseBar} />
        <div className={styles.buildArea}>
          <div className={styles.printFill} style={{ height: `${clamped}%` }} />
          <div className={styles.buildPlate} />
          <div className={styles.gantry} style={{ bottom: `${clamped}%` }}>
            <div className={printing ? `${styles.nozzle} ${styles.nozzleSweeping}` : styles.nozzle} />
          </div>
        </div>
      </div>
    </div>
  );
};
