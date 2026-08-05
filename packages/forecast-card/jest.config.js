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
  moduleNameMapper: {
    // Mirrors tsconfig.json's "@zupre/core": ["../core/src"] path alias.
    '^@zupre/core$': '<rootDir>/../core/src/index.ts',
    '\\.module\\.css$': '<rootDir>/src/__mocks__/styleMock.js',
    // Webpack inlines .png imports as data URIs (asset/inline); Jest has no
    // such loader, so route them to a stub string instead.
    '\\.png$': '<rootDir>/src/__mocks__/fileMock.js',
    // Mirrors core/webpack.base.js's preact/compat aliasing — zustand has an
    // optional react import that Jest will otherwise fail to resolve.
    '^react$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
    '^react-dom$': 'preact/compat',
    '^react/jsx-runtime$': 'preact/jsx-runtime',
  },
};
