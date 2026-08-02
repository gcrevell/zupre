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
  it('shows the power button when configured and the printer is idle', () => {
    const container = renderHeader(baseConfig, 'Idle');
    expect(container.querySelector('[aria-label="Toggle power"]')).not.toBeNull();
  });

  it('hides the power button while the printer is printing', () => {
    const container = renderHeader(baseConfig, 'Printing');
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });

  it('is case-insensitive about the printing status', () => {
    const container = renderHeader(baseConfig, 'printing');
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });

  it('never shows the power button when no power_entity is configured', () => {
    const container = renderHeader({ ...baseConfig, power_entity: undefined }, 'Idle');
    expect(container.querySelector('[aria-label="Toggle power"]')).toBeNull();
  });
});
