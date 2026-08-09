const path = require('path');
const createConfig = require('@zupre/core/webpack.base');

module.exports = createConfig({
  entry: './src/index.tsx',
  outputFilename: 'printer-card.js',
  outputPath: path.resolve(__dirname, 'dist'),
});
