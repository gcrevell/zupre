import { render } from 'preact';
import { PrinterGraphic } from './PrinterGraphic';
import styles from './card.module.css';

const renderGraphic = (props: { printing: boolean; active: boolean }) => {
  const container = document.createElement('div');
  render(<PrinterGraphic progress={50} {...props} />, container);
  return container;
};

describe('PrinterGraphic', () => {
  it('shows the idle sleep icon when not active', () => {
    const container = renderGraphic({ printing: false, active: false });
    expect(container.querySelector(`.${styles.idleIcon}`)).not.toBeNull();
  });

  it('hides the idle icon while active, even if not currently moving (e.g. paused)', () => {
    const container = renderGraphic({ printing: false, active: true });
    expect(container.querySelector(`.${styles.idleIcon}`)).toBeNull();
  });

  it('only sweeps the nozzle while actually printing, not just active', () => {
    const printing = renderGraphic({ printing: true, active: true });
    const paused = renderGraphic({ printing: false, active: true });

    expect(printing.querySelector(`.${styles.nozzleSweeping}`)).not.toBeNull();
    expect(paused.querySelector(`.${styles.nozzleSweeping}`)).toBeNull();
  });
});
