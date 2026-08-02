import { FunctionComponent } from 'preact';
import { Stat } from './sensors';
import styles from './card.module.css';

type Props = {
  stats: Stat[];
  percent: number;
  showPercent?: boolean;
};

export const Stats: FunctionComponent<Props> = ({ stats, percent, showPercent = true }) => (
  <div className={styles.stats}>
    {showPercent && (
      <div className={styles.percent}>
        {Math.round(Math.max(0, Math.min(100, percent)))}
        %
      </div>
    )}
    <div className={styles.monitored}>
      {stats.map((stat) => (
        <div className={styles.stat} key={stat.key}>
          <span className={styles.statLabel}>{stat.name}</span>
          <span className={styles.statValue}>{stat.value}</span>
        </div>
      ))}
    </div>
  </div>
);
