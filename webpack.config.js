const path = require("path");
const resolvePath = (relativePath) => path.resolve(__dirname, relativePath);

module.exports = {
    cache: {
        type: 'filesystem'
    },
    devtool: "source-map",
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'swc-loader',
                include: [ resolvePath('src') ],
                exclude: [ /node_modules/ ],
            },
        ],
    },
    resolve: {
        plugins: [ ],
        extensions: [ '.ts', '.js'],
    },
    output: {
        sourceMapFilename: "bundle.js.map",
        filename: 'bundle.js',
        path: __dirname,
    },
    mode: 'development',
};