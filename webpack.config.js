/* eslint-disable node/no-unpublished-require */
const path = require('path');
// const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin'); //minimize js content
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: { bundle: './public/js/index.js', 'styles-libs': './public/scss/styles-libs.scss' },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, './public/dist'), //create dist directory and save it bundle.js
    publicPath: 'dist/'
  },
  watch: true,
  watchOptions: {
    ignored: ['node_modules/**']
  },
  mode: 'development',
  devtool: 'inline-source-map', //Webpack default uses eval and throws `unsafe-eval` error
  module: {
    // how to import files
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader' // once css-loader calisir sonra style-loader
        ]
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'] //convert ES6 to support old browsers
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        loader: 'file-loader'
      },
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: ['$', 'jQuery']
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        '!*contenthash.pug',
        path.resolve(__dirname, './public/dist/*'),
        path.resolve(__dirname, './public/dist/*.map')
      ],
      // cleanAfterEveryBuildPatterns: [path.resolve(__dirname, './public/dist/*.map'),path.resolve(__dirname, './public/dist/*.map')],
      // dangerouslyAllowCleanPatternsOutsideProject: true,
      // protectedWebpackAssets: false,
      dry: false
    }), // removes unused files in dist folder
    new HtmlPlugin({
      filename: 'contenthash.pug',
      filetype: 'pug',
      template: path.resolve(__dirname, './views/_partials/empty.pug')
    }),
    // new TerserPlugin(), // minimize js content
    new MiniCssExtractPlugin({
      filename: 'style.css'
    }) // extract css into separate file
  ]
};
