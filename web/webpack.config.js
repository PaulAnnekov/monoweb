var path = require('path');

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3000
  },
  mode: 'development',
  entry: './src/index',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.scss$/,
      use: [
        'style-loader',
        'css-modules-typescript-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            modules: true,
            localIdentName: '[local]--[hash:base64]',
          }
        },
        {
          loader: "sass-loader",
          options: {sourceMap: true}
        }
      ]
    }]
  }
};
