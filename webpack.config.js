const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './js/index.js',
    output: {
        filename: 'dapp-sdk.bundle.js',
        path: path.resolve(__dirname, './static/dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            parallel: 8,
        })], // for ES6
    },
};
