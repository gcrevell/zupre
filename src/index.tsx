import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { createStore, StoreContext } from 'store';
import { Card } from './card';
import { Config } from './types';

class BoilerplateCard extends HTMLElement {
  private _store = createStore();

  set hass(hass: HomeAssistant | undefined) {
    this._store.setState({ hass });
    this._render();
  }

  setConfig(config: Config) {
    this._store.setState({ config });
    this._render();
  }

  private _render = () => {
    render(
      (
        <StoreContext.Provider value={this._store}>
          <ha-card>
            <Card />
          </ha-card>
        </StoreContext.Provider>
      ), this,
    );
  };

  getCardSize() {
    return 1;
  }
}

customElements.define('boilerplate-card', BoilerplateCard);

declare module 'preact/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': { [key: string]: unknown };
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
  type: 'boilerplate-card',
  name: 'Boilerplate Card',
  preview: false,
  description: 'Boilerplate Card x React',
});
