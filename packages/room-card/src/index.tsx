import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from '@zupre/core';
import { Card } from './card';
import { Editor } from './editor';
import { Config } from './types';

// Home Assistant wraps dashboard cards (and the card editor dialog) in
// several layers of Shadow DOM (hui-card, hui-view, home-assistant-main,
// hui-dialog-edit-card, ...), so a <style> tag injected into document.head
// by style-loader never reaches this element's light-DOM content — it lives
// in an unrelated tree scope. Cloning it into our own subtree keeps it in
// the same tree scope as whatever we render, regardless of where HA ends up
// placing the element.
const injectCardStyles = (host: HTMLElement) => {
  if (host.querySelector(':scope > style[data-card-style]')) return;
  // style-loader emits one <style data-card-style> per CSS module (card +
  // editor), so clone all of them — grabbing only the first leaves the other
  // module's styles stranded in document.head, out of this element's scope.
  document.head.querySelectorAll('style[data-card-style]').forEach((source) => {
    host.prepend(source.cloneNode(true));
  });
};

class RoomCard extends HTMLElement {
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

  getCardSize() {
    return 1;
  }

  static getConfigElement() {
    return document.createElement('room-card-editor');
  }

  static getStubConfig(): Omit<Config, 'type'> {
    return {
      name: 'Room',
      icon: 'mdi:sofa',
    };
  }
}

class RoomCardEditor extends HTMLElement {
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

customElements.define('room-card', RoomCard);
customElements.define('room-card-editor', RoomCardEditor);

declare module 'preact/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': { [key: string]: unknown };
      'ha-icon': { [key: string]: unknown };
      // Duplicated from @zupre/core's declarations.d.ts: each package's
      // TypeScript program is compiled independently (see webpack.base.js
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
  type: 'room-card',
  name: 'Room Card',
  preview: false,
  description: 'Single-room card with brightness and quick actions',
});
