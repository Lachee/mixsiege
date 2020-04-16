const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

const serverConfig = {
    target: 'node',
    entry: './src/server/index.js',
    output: {
        path: path.resolve(__dirname, './'),
        filename: 'build.js',
    },
    externals: [
        nodeExternals()
    ]
};

const clientConfig = {
    target: 'web',
    entry: './src/mixy/app.js',
    output: {
        filename: 'mixy.js',
        chunkFilename: 'vendor.[name].js',
        path: path.resolve(__dirname, 'public/dist'),
        publicPath: '/dist/',
        library: 'mixy',

    },
    module: {
        rules: [
          {
            test: /\.xs[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                'style-loader',
                // Translates CSS into CommonJS
                'css-loader',
                // Compiles Sass to CSS
                'sass-loader',
            ],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader' },
            { loader: 'sass-loader', options: { sourceMap: true } },
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'mixy.css'
      }),
    ],
    devServer: {
        host: '0.0.0.0',
        publicPath: '/assets/',
        contentBase: path.resolve(__dirname, './views'),
        watchContentBase: true,
        compress: true,
        port: 9000,
    },
    devtool: 'inline-source-map',
}

module.exports = [ clientConfig, serverConfig ];