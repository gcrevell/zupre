/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // jest-environment-jsdom otherwise adds "browser" to the resolved package
  // export conditions, which makes preact/jsx-runtime resolve to its ESM
  // build (`exports.browser`) instead of the CJS one Jest can actually run
  // without a node_modules transform.
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  // Mirrors tsconfig.json's baseUrl + "*": ["./src/*"] so bare imports like
  // `from 'hooks'` resolve the same way they do for webpack/ts-loader.
  modulePaths: ['<rootDir>/src'],
  // @zupre/core is mapped to its TypeScript source below, but it now lives in
  // node_modules, which Jest excludes from transforms by default — so without
  // this exception ts-jest never compiles it and Jest chokes on the raw
  // `export` syntax. Back when core was a sibling workspace the path fell
  // outside node_modules and this wasn't needed.
  transformIgnorePatterns: ['/node_modules/(?!@zupre/core/)'],
  moduleNameMapper: {
    // @zupre/core's package main points at dist/, which tsc emits as ES
    // modules — Jest can't require those, and ts-jest's transform only covers
    // .ts/.tsx, so it can't rewrite them either. Resolving to the package's
    // TypeScript source instead puts it back on a path ts-jest does handle.
    '^@zupre/core$': '@zupre/core/src/index.ts',
    '\\.module\\.css$': 'identity-obj-proxy',
    // Mirrors @zupre/core's webpack.base.js preact/compat aliasing — zustand
    // has an optional react import that Jest will otherwise fail to resolve.
    '^react$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
    '^react-dom$': 'preact/compat',
    '^react/jsx-runtime$': 'preact/jsx-runtime',
  },
};
