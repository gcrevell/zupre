import { FunctionComponent } from 'preact';
import styles from './editor.module.css';

type Props = {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
};

// A self-contained segmented control rather than mwc-tab-bar: HA doesn't
// reliably register that element for custom cards, and a plain button group
// always renders and is styled entirely by our own (now-injected) CSS. The
// segmented look also reads as distinct from HA's underline dialog tabs sitting
// just above it.
export const Tabs: FunctionComponent<Props> = ({ tabs, active, onChange }) => (
  <div className={styles.tabs} role="tablist">
    {tabs.map((label, index) => (
      <button
        key={label}
        type="button"
        role="tab"
        aria-selected={index === active}
        className={index === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        onClick={() => onChange(index)}
      >
        {label}
      </button>
    ))}
  </div>
);
