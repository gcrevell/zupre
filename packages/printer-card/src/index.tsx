import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from '@zupre/core';
import { Card } from './card';
import { Editor } from './editor';
import { Config } from './types';
import { log } from './debug';

// See @zupre/room-card's src/index.tsx for the rationale: HA nests cards
// several Shadow DOM boundaries deep, so a <style> injected into
// document.head by style-loader never reaches this element's light-DOM
// content. Cloning the tagged <style> into our own subtree keeps it in the
// same tree scope as whatever we render, regardless of where HA places us.
const injectCardStyles = (host: HTMLElement) => {
  if (host.querySelector(':scope > style[data-card-style]')) return;
  document.head.querySelectorAll('style[data-card-style]').forEach((source) => {
    host.prepend(source.cloneNode(true));
  });
};

class PrinterCard extends HTMLElement {
  private _store = createStore();

  private _mount?: HTMLDivElement;

  set hass(hass: HomeAssistant | undefined) {
    this._store.setState({ hass });
    this._render();
  }

  setConfig(config: Config) {
    log('PrinterCard.setConfig', config);
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

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('printer-card-editor');
  }

  static getStubConfig(): Omit<Config, 'type'> {
    return {
      name: '3D Printer',
      base_entity: '',
      printer_type: 'I3' as Config['printer_type'],
      monitored: ['Status', 'ETA', 'Remaining', 'Hotend', 'Bed'] as Config['monitored'],
    };
  }
}

class PrinterCardEditor extends HTMLElement {
  private _mount?: HTMLDivElement;

  private _config?: Config;

  private _hass?: HomeAssistant;

  setConfig(config: Config) {
    log('PrinterCardEditor.setConfig (from HA)', config);
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
    log('PrinterCardEditor dispatching config-changed', config);
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

customElements.define('printer-card', PrinterCard);
customElements.define('printer-card-editor', PrinterCardEditor);

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
  type: 'printer-card',
  name: 'Printer Card',
  preview: false,
  description: '3D printer status card with live progress graphic',
});
