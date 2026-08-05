// ts-jest compiles `import styles from './x.module.css'` down to
// `require('./x.module.css').default` (our ambient `declarations.d.ts`
// declares `export default classes`, so TS always emits a `.default` access
// for it — unlike the real webpack build, where css-loader's `esModule:
// false` plus ES import syntax lets webpack's own harmony interop use
// `module.exports` directly; see core/webpack.base.js). Plain
// identity-obj-proxy has no `.default`, so under Jest `styles` silently
// becomes the string "default" instead of a proxy — this mock adds that
// property, routing it back to itself.
const proxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'default') return proxy;
    if (prop === '__esModule') return true;
    return prop;
  },
});

module.exports = proxy;
