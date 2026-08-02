import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from '@zupre/core';
import { Header } from './Header';
import { Config } from '../types';

const baseConfig: Config = {
  type: 'custom:printer-card',
  base_entity: 'sensor.printer',
  power_entity: 'switch.printer',
};

const renderHeader = (config: Config, status: string) => {
  const container = document.createElement('div');
  const store = createStore();
  store.setState({
    hass: { states: {}, callService: jest.fn() } as unknown as HomeAssistant,
  });

  render(
    <StoreContext.Provider value={store}>
      <Header config={config} status={status} expanded onToggleExpanded={() => {}} />
    </StoreContext.Provider>,
    container,
  );

  return container;
};

describe('Header power button', () => {
  it.each(['Idle', 'Ready', 'Finished', 'Stopped', 'Error'])('shows the power button when %s', (status) => {
    const container = renderHeader(baseConfig, status);
    expect(container.querySelector('[aria-label="Toggle power"]')).not.toBeNull();
  });

  it.each(['Printing', 'Paused', 'Attention', 'Busy'])('hides the power button when %s (any in-progress job)', (status) => {
    const container = renderHeader(baseConfig, status);
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });

  it('is case-insensitive about status', () => {
    const container = renderHeader(baseConfig, 'printing');
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });

  it('never shows the power button when no power_entity is configured', () => {
    const container = renderHeader({ ...baseConfig, power_entity: undefined }, 'Idle');
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });
});
