import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from '@zupre/core';
import { Actions } from './Actions';

const BASE_ENTITY = 'sensor.second_bedroom_prusa_3d_printer';

const renderActions = (status: string, callService = jest.fn(), baseEntity = BASE_ENTITY) => {
  const container = document.createElement('div');
  const store = createStore();
  store.setState({
    hass: { states: {}, callService } as unknown as HomeAssistant,
  });

  render(
    <StoreContext.Provider value={store}>
      <Actions baseEntity={baseEntity} status={status} />
    </StoreContext.Provider>,
    container,
  );

  return container;
};

const labels = (container: HTMLElement) => (
  Array.from(container.querySelectorAll('button')).map((button) => button.textContent)
);

describe('Actions', () => {
  it('offers Pause/Cancel while printing', () => {
    expect(labels(renderActions('Printing'))).toEqual(['Pause', 'Cancel']);
  });

  it('offers Resume/Cancel while paused', () => {
    expect(labels(renderActions('Paused'))).toEqual(['Resume', 'Cancel']);
  });

  it('offers Continue/Cancel when the printer needs attention', () => {
    expect(labels(renderActions('Attention'))).toEqual(['Continue', 'Cancel']);
  });

  it('offers only Cancel while busy', () => {
    expect(labels(renderActions('Busy'))).toEqual(['Cancel']);
  });

  it.each(['Idle', 'Ready', 'Finished', 'Stopped', 'Error'])('renders nothing when %s', (status) => {
    expect(renderActions(status).childElementCount).toBe(0);
  });

  it('derives the button entity id from base_entity and presses it', () => {
    const callService = jest.fn();
    const container = renderActions('Printing', callService);
    const pauseButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Pause');

    pauseButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(callService).toHaveBeenCalledWith('button', 'press', {
      entity_id: 'button.second_bedroom_prusa_3d_printer_pause_job',
    });
  });

  // Regression: a base_entity with no domain prefix (e.g. a misconfigured
  // "second_bedroom_printer" instead of "sensor.second_bedroom_printer")
  // used to have its unmodified string spliced straight into the button
  // entity id rather than being rejected as a config error.
  it('renders nothing when base_entity has no domain prefix', () => {
    const container = renderActions('Printing', jest.fn(), 'second_bedroom_prusa_3d_printer');
    expect(container.childElementCount).toBe(0);
  });
});
