const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "development",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "main.js",
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 5000,
        watchContentBase: true,
    },

    devtool: "inline-source-map",
    plugins: [
        new CopyPlugin({
            patterns: [{ from: "public" }, { from: "assets", to: "assets" }],
        }),
    ],
};
