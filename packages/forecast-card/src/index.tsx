import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from '@zupre/core';
import { Card } from './card';
import { Editor } from './editor';
import { Config } from './types';

// HA wraps cards in several Shadow DOM layers (hui-card, hui-view,
// home-assistant-main, hui-dialog-edit-card, ...), so a <style> injected into
// document.head by style-loader never reaches this element's light-DOM content.
// Cloning it into our own subtree keeps it in the same tree scope.
const injectCardStyles = (host: HTMLElement) => {
  if (host.querySelector(':scope > style[data-card-style]')) return;
  document.head.querySelectorAll('style[data-card-style]').forEach((source) => {
    host.prepend(source.cloneNode(true));
  });
};

class ForecastCard extends HTMLElement {
  private _store = createStore();

  private _mount?: HTMLDivElement;

  set hass(hass: HomeAssistant | undefined) {
    this._store.setState({ hass });
    this._render();
  }

  setConfig(config: Config) {
    this._store.setState({ config });
    this._render();
  }

  private _getMount = () => {
    if (!this._mount) {
      this._mount = document.createElement('div');
      this.appendChild(this._mount);
    }
    return this._mount;
  };

  private _render = () => {
    injectCardStyles(this);
    render(
      (
        <StoreContext.Provider value={this._store}>
          <ha-card>
            <Card />
          </ha-card>
        </StoreContext.Provider>
      ), this._getMount(),
    );
  };

  // Reads current store state at call time (not a static estimate): the
  // card's rendered height depends on show_header/show_forecast/forecast_type,
  // which can only be known from config, and 'both' mode is roughly double
  // the height of a single forecast row.
  getCardSize() {
    const { config } = this._store.getState() as { config?: Config };
    if (!config) return 3;
    const showHeader = config.show_header ?? true;
    const showForecast = config.show_forecast ?? true;
    let size = 1;
    if (showHeader) size += 2;
    if (showForecast) size += config.forecast_type === 'both' ? 4 : 2;
    return size;
  }

  static getConfigElement() {
    return document.createElement('forecast-card-editor');
  }

  static getStubConfig(): Omit<Config, 'type'> {
    return {
      entity: '',
      forecast_type: 'daily',
      max_items: 5,
    };
  }
}

class ForecastCardEditor extends HTMLElement {
  private _mount?: HTMLDivElement;

  private _config?: Config;

  private _hass?: HomeAssistant;

  setConfig(config: Config) {
    this._config = config;
    this._render();
  }

  set hass(hass: HomeAssistant | undefined) {
    this._hass = hass;
    this._render();
  }

  private _getMount = () => {
    if (!this._mount) {
      this._mount = document.createElement('div');
      this.appendChild(this._mount);
    }
    return this._mount;
  };

  private _onChange = (config: Config) => {
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  };

  private _render = () => {
    if (!this._config) return;
    injectCardStyles(this);
    render(
      <Editor config={this._config} hass={this._hass} onChange={this._onChange} />,
      this._getMount(),
    );
  };
}

customElements.define('forecast-card', ForecastCard);
customElements.define('forecast-card-editor', ForecastCardEditor);

declare module 'preact/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': { [key: string]: unknown };
      'ha-icon': { [key: string]: unknown };
      // Duplicated from @zupre/core's declarations.d.ts: each package's
      // TypeScript program is compiled independently (see core/webpack.base.js
      // build notes), so an ambient module augmentation declared only in
      // core isn't visible here even though HaForm itself is imported fine.
      'ha-form': { [key: string]: unknown };
    }
  }
}

declare global {
  interface Window {
    customCards?: {
      type: string,
      name: string,
      preview: boolean,
      description: string,
    }[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'forecast-card',
  name: 'Forecast Card',
  preview: false,
  description: 'Weather card with condition-driven animated background and daily/hourly forecast',
});
