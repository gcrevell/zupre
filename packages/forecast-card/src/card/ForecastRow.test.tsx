import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ForecastAttributes } from 'hooks';
import { ForecastRow } from './ForecastRow';

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

(global as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

const items: ForecastAttributes[] = Array.from({ length: 7 }, (_, i) => ({
  datetime: `2024-01-0${i + 1}T09:00:00`,
  condition: 'sunny',
  temperature: 20 + i,
  templow: 10 + i,
}));

const renderRow = (props: { items: ForecastAttributes[]; isHourly: boolean }, width: number) => {
  const container = document.createElement('div');
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width, height: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON() {},
  } as DOMRect);

  act(() => {
    render(<ForecastRow minColumnWidth={50} {...props} />, container);
  });

  return container;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ForecastRow', () => {
  it('truncates columns to fit the available width instead of wrapping', () => {
    const container = renderRow({ items, isHourly: false }, 220); // floor(220 / 50) = 4
    expect(container.querySelectorAll('.forecastDay')).toHaveLength(4);
  });

  it('shows every item when there is room for all of them', () => {
    const container = renderRow({ items, isHourly: false }, 1000);
    expect(container.querySelectorAll('.forecastDay')).toHaveLength(items.length);
  });

  it('hides the low temperature in hourly mode', () => {
    const container = renderRow({ items, isHourly: true }, 1000);
    expect(container.querySelectorAll('.lo')).toHaveLength(0);
    expect(container.querySelectorAll('.hi')).toHaveLength(items.length);
  });

  it('shows the low temperature in non-hourly mode', () => {
    const container = renderRow({ items, isHourly: false }, 1000);
    expect(container.querySelectorAll('.lo')).toHaveLength(items.length);
  });
});
