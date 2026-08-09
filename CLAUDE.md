# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

This is a yarn workspaces monorepo (`workspaces: ["packages/*"]`) holding one or more Home Assistant custom Lovelace cards, all built on a shared base that lives in a **separate repository**:

- `packages/room-card` (`@zupre/room-card`) — a single-room card with brightness control and quick actions.
- `packages/printer-card` (`@zupre/printer-card`) — a PrusaLink 3D printer status card.
- `@zupre/core` — the generic, product-agnostic base: the zustand store + Preact context, hooks, the `HaForm` `<ha-form>` wrapper, the minimal `BaseConfig` type (`{ type: string }`, the only field every Lovelace card config is guaranteed to have), and the shared webpack config factory. It is **not** in this repo — it lives at [gcrevell/trellis](https://github.com/gcrevell/trellis) and each card depends on it as an ordinary git dependency (`"@zupre/core": "github:gcrevell/trellis#main"`).

Core used to be `packages/core` here. Before that, the base lived on the `master` branch with each product a long-lived branch off it. Both models made base changes and product changes hard to tell apart; a separate repo with a real dependency edge means the base has its own CI and its own history, and a card pins the version of it that it wants.

**Adding a new product package**: copy `packages/room-card`'s shape (`package.json`, `tsconfig.json`, `webpack.config.js` calling `@zupre/core/webpack.base`), give it a fixed output filename, and add its `build`/`watch` scripts to the root `package.json` (`yarn workspace @zupre/<name> run build`).

## Depending on `@zupre/core`

Each card declares `"@zupre/core": "github:gcrevell/trellis#main"`. Yarn clones that repo and runs its `prepare` script, which compiles TypeScript to `dist/` — so what lands in `node_modules` is **built JavaScript plus declarations**, not raw source. That detail is load-bearing: ts-loader's rule excludes `node_modules/`, so if the package shipped only TypeScript, webpack would silently skip compiling it and the build would fail on syntax it never transformed. Because core arrives pre-compiled, webpack just bundles it like any other dependency.

Consequences worth knowing:

- **Pushing to trellis is what ships a base change.** `#main` is a moving target; a `yarn install` picks up whatever main points at. Pin a SHA (`#<sha>`) instead if you want a card frozen against base churn.
- **Yarn caches git dependencies aggressively.** If trellis's history is rewritten (force-push, amended commit), `yarn install` can fail with `fatal: Need to specify how to reconcile divergent branches` — it's trying to `git pull` a cached mirror that diverged. Clear it with `rm -rf "$(yarn cache dir)/.tmp"` and reinstall.
- **Jest needs two exceptions** (`packages/printer-card/jest.config.js`): core is mapped to its TypeScript source rather than `dist/`, because tsc emits ES modules that Jest can't `require` and ts-jest's transform only covers `.ts`/`.tsx`. That mapping in turn needs `transformIgnorePatterns` to stop ignoring `node_modules/@zupre/core`, since Jest excludes node_modules from transforms by default. Neither was needed when core was a sibling workspace outside node_modules.

**Each package's TypeScript program is independent** — a card's `tsconfig.json` only `include`s its own `src/`. Core's regular `.ts`/`.tsx` files resolve fine through its `types` entry point, but core's `declarations.d.ts` (ambient JSX intrinsic augmentation for `<ha-form>`) is never `import`ed by name, so nothing pulls it into a card's program. Adding core's files to a card's `include` looks like the fix, but **don't do that** — it was tried and it broke JSX resolution for every standard intrinsic (`div`, `span`, ...) across the whole program in a way that wasn't worth chasing further. Instead, the `ha-form` intrinsic declaration is duplicated: once in trellis's own `src/declarations.d.ts` (so it type-checks standalone) and once per card in `src/index.tsx`. Any new product package that renders `<ha-form>` directly needs the same duplicated three-line declaration.

## Commands

```bash
yarn install     # from repo root — also clones @zupre/core and runs its build
yarn build       # builds every card → packages/<name>/dist/<name>.js
yarn watch       # build with file watching
yarn lint        # ESLint across every package's src/
yarn test        # runs @zupre/printer-card's jest suite (the only package with tests today)
```

Per-package: `cd packages/room-card && yarn dev` starts a webpack dev server (HMR, `allowedHosts: 'all'`) for pointing a real HA instance at `http://<your-machine>:8080/room-card.js` during development.

## Architecture (per product package, e.g. `room-card`)

**Data flow:** Home Assistant calls `set hass()` and `setConfig()` on the card's web component (`packages/room-card/src/index.tsx`). Both write directly into the zustand store (`@zupre/core`'s `store.ts`), which triggers reactive re-renders of the Preact tree.

**Web component → Preact bridge**: `RoomCard extends HTMLElement` wraps the Preact render (into a lazily-created child `<div>`, not `this` directly — DOM mutation isn't allowed inside a custom element's constructor). The card itself renders into light DOM (no shadow root), but HA nests every card several Shadow DOM boundaries deep (`hui-card`, `hui-view`, `home-assistant-main`, ...), so a `<style>` tag injected into `document.head` by style-loader never reaches it — it's a different CSS tree scope. To work around this, style-loader tags its injected `<style>` with `data-card-style` (see `@zupre/core`'s `webpack.base.js`), and on first render the card clones that tag into its own subtree, so the CSS travels with the card regardless of where HA places it. Verify styling changes against something that actually nests the card in a Shadow DOM ancestor (a plain test page without one will falsely look fine).

**Hooks** (`@zupre/core`'s `hooks/`, generic): `useEntity` / `useEntities` (reactive selectors over `hass.states`), `useHass` (raw `HomeAssistant` instance), `useConfig` (returns `BaseConfig | undefined`), `useUser`, `useHistory`. Each product package wraps `useConfig` locally to cast to its own richer config type (see `packages/room-card/src/hooks/useConfig.ts`) rather than threading a generic type parameter through the store/context — simpler for a per-product config shape than a fully generic store.

**Path aliases** (each package's `tsconfig.json`, `baseUrl: "."` + `"*": ["./src/*"]`): within a package, imports like `import { useConfig } from 'hooks'` resolve to that package's own `src/hooks`. webpack mirrors this via `tsconfig-paths-webpack-plugin`. `@zupre/core` is deliberately *not* aliased here — it resolves through ordinary node_modules lookup, as described above.

**CSS Modules** (`@zupre/core`'s `webpack.base.js`): `.module.css` files are processed by css-loader (with `esModule: false` to fix webpack harmony import interop) and injected at runtime by style-loader. Class names are generated as `<package-output-name>-[local]--[hash:base64:5]` (e.g. `room-card-root--Dc696`) — the `<package-output-name>-` prefix is load-bearing, not cosmetic: `[hash:base64:5]` alone collides identically across packages for any class name that appears in more than one product package (confirmed empirically — every product package mirrors the same `src/card/card.module.css` shape, and the hash turns out to depend only on the class name, not the file's path or content). Since every card's `injectCardStyles` (below) clones *every* `<style data-card-style>` tag it finds in `document.head` into its own subtree, not just its own, an unprefixed collision lets one card's CSS silently override another's whenever two cards share a class name and end up on the same dashboard. Keep the prefix if you ever touch this loader config. The TypeScript declaration for `*.module.css` imports lives in each product package's own `src/declarations.d.ts`.

**Preact/React aliasing** (`@zupre/core`'s `webpack.base.js`): `react` and `react-dom` are aliased to `preact/compat`, so React-ecosystem libraries work without modification. `packages/printer-card/jest.config.js` mirrors this in `moduleNameMapper` — it's not optional there either, since zustand has an optional `react` import that Jest will otherwise fail to resolve.

**ESLint** (root `eslint.config.mjs`, shared across all packages): ESLint 9 flat config using `typescript-eslint` (unified package) + `eslint-plugin-react` + `eslint-plugin-react-hooks`, scoped to `packages/*/src/**/*.{ts,tsx}`. No airbnb config — it doesn't support the flat config format. Each package's `lint` script (`eslint "src/**"`) runs from that package's own directory; ESLint's flat-config lookup walks up to find this shared root config automatically.

## Customization entry points (per product package)

- `src/types.ts` — extend `Config` (`Room & BaseConfig` for `room-card`) with your card's YAML config fields
- `src/card/index.tsx` + `src/card/card.module.css` — the root card component and its styles
- `src/index.tsx` — `customElements.define('room-card', ...)` and the `window.customCards` entry name the card

## CI / Deployment

`.github/workflows/release.yml` builds every product package on push to `main` and publishes each one's `dist/<name>.js` as an asset on a rolling `latest` GitHub Release (repo is public, so no auth is needed to fetch it). The homeassistant config repo consumes this by `curl`ing `https://github.com/gcrevell/zupre/releases/download/latest/room-card.js` directly into its `www/` — see that repo's `scripts/update-room-card.sh` and its `CLAUDE.md`. There's no local copy/deploy step from this repo anymore; pushing to `main` is the deploy.
