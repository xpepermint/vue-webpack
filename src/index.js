const webpack = require("webpack");
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const cssNext = require('postcss-cssnext');

/*
* Returns module object.
*/

function getModules() {
  let rules = [
    {
      test: /\.vue$/,
      loader: 'vue',
      options: {
        postcss: [
          cssNext()
        ],
        loaders: {
          css: ExtractTextPlugin.extract({
            loader: `css-loader`,
            fallbackLoader: 'vue-style-loader'
          })
        }
      }
    },
    {
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/
    },
    {
      test: /\.json$/,
      loader: 'json'
    },
    {
      test: /\.(png|jpg|gif|svg)$/,
      loader: 'file',
      options: {
        name: '[name].[ext]?[hash]'
      }
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'file',
      query: {
        name: '[name].[ext]?[hash]'
      }
    }
  ];

  return {rules};
}

/*
* Returns entry object.
*/

function getEntry({entryFilePath, hotReload}) {
  let paths = [
    path.resolve(entryFilePath)
  ];

  if (hotReload) {
    paths.push(`webpack-hot-middleware/client?path=/__webpack_hmr`)
  }

  return paths;
}

/*
* Returns output object.
*/

function getOutput({isServer, outputPath, outputFileName, publicPath}={}) {
  let fileName = outputFileName.indexOf(".") !== -1
    ? outputFileName.substr(0, outputFileName.lastIndexOf("."))
    : outputFileName;

  return {
    path: path.resolve(outputPath),
    filename: `${fileName}.js`,
    publicPath,
    libraryTarget: isServer ? 'commonjs2' : 'var'
  };
}

/*
* Returns plugins object.
*/

function getPlugins({env, mode, splitStyle, uglify, minify, hotReload, outputFileName}={}) {
  let isDev = env.toLowerCase() === 'development';

  let fileName = outputFileName.indexOf(".") !== -1
    ? outputFileName.substr(0, outputFileName.lastIndexOf("."))
    : outputFileName;

  let plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
      'process.env.VUE_ENV': JSON.stringify(mode)
    }),
  ];

  if (splitStyle) {
    plugins.push(
      new ExtractTextPlugin(`${fileName}.css`)
    );
  }

  if (uglify) {
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compress: {warnings: false}
      })
    );
  }

  if (minify) {
    plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true
      })
    );
  }

  if (hotReload) {
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    );
  }

  if (!isDev) {
    plugins.push(
      new webpack.optimize.DedupePlugin()
    );
  }

  return plugins;
}

/*
* Builds and returns a Webpack configuration object.
*/

exports.build = function ({
  entryFilePath,
  env='development',
  hotReload,
  minify,
  mode='browser',
  outputFileName='bundle',
  outputPath,
  publicPath='/',
  splitStyle=true,
  uglify
}={}) {
  if (!entryFilePath) throw new Error('entryFilePath is a required option')
  if (!outputPath) throw new Error('outputPath is a required option')

  const isDev = env.toLowerCase() === 'development';
  const isServer = mode.toLowerCase() === 'server';

  if (isDev) {
    if (typeof hotReload === 'undefined') hotReload = true;
    if (typeof uglifyJs === 'undefined') uglify = false;
    if (typeof minify === 'undefined') minify = false;
  }
  else {
    hotReload = false;
    if (typeof uglify === 'undefined') uglify = true;
    if (typeof minify === 'undefined') minify = true;
  }

  if (isServer) {
    hotReload = false;
  }

  return {
    target: isServer ? 'node' : 'web',
    devtool: !isServer && isDev ? '#source-map' : false,
    module: getModules(),
    entry: getEntry({entryFilePath, hotReload}),
    output: getOutput({isServer, outputPath, outputFileName, publicPath}),
    plugins: getPlugins({env, mode, splitStyle, uglify, minify, hotReload, outputFileName})
  };
}
