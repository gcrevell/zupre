import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from 'store';
import { Card } from './card';
import { Config } from './types';

class RoomCard extends HTMLElement {
  private _store = createStore();

  private _mount?: HTMLDivElement;

  private _stylesInjected = false;

  set hass(hass: HomeAssistant | undefined) {
    this._store.setState({ hass });
    this._render();
  }

  setConfig(config: Config) {
    this._store.setState({ config });
    this._render();
  }

  // Home Assistant wraps dashboard cards in several layers of Shadow DOM
  // (hui-card, hui-view, home-assistant-main, ...), so a <style> tag injected
  // into document.head by style-loader never reaches this card's light-DOM
  // content — it lives in an unrelated tree scope. Cloning it into our own
  // subtree keeps it in the same tree scope as whatever we render, regardless
  // of where HA ends up placing this element.
  private _ensureStyles = () => {
    if (this._stylesInjected) return;
    const source = document.head.querySelector('style[data-card-style]');
    if (source) {
      this.prepend(source.cloneNode(true));
      this._stylesInjected = true;
    }
  };

  private _getMount = () => {
    if (!this._mount) {
      this._mount = document.createElement('div');
      this.appendChild(this._mount);
    }
    return this._mount;
  };

  private _render = () => {
    this._ensureStyles();
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
}

customElements.define('room-card', RoomCard);

declare module 'preact/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': { [key: string]: unknown };
      'ha-icon': { [key: string]: unknown };
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
