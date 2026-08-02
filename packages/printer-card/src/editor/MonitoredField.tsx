import { FunctionComponent } from 'preact';
import { MonitoredCondition } from '../types';
import styles from './editor.module.css';

type Props = {
  monitored: string[];
  onChange: (monitored: string[]) => void;
};

const CONDITIONS = Object.values(MonitoredCondition);

// A fixed-order checklist rather than a reorderable list: keeps the editor
// simple and dependency-free. Custom (non-standard) monitored keys backed by
// `sensors` overrides can still be added via YAML; this only toggles the
// built-in conditions.
export const MonitoredField: FunctionComponent<Props> = ({ monitored, onChange }) => {
  const toggle = (condition: string) => {
    if (monitored.includes(condition)) {
      onChange(monitored.filter((entry) => entry !== condition));
    } else {
      onChange([...monitored, condition]);
    }
  };

  return (
    <div className={styles.checklist}>
      {CONDITIONS.map((condition) => (
        <label key={condition} className={styles.checklistItem}>
          <input
            type="checkbox"
            checked={monitored.includes(condition)}
            onChange={() => toggle(condition)}
          />
          {condition}
        </label>
      ))}
    </div>
  );
};
