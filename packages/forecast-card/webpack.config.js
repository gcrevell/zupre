const path = require('path');
const createConfig = require('../core/webpack.base');

module.exports = createConfig({
  entry: './src/index.tsx',
  outputFilename: 'forecast-card.js',
  outputPath: path.resolve(__dirname, 'dist'),
});
