const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/index.js",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 5000,
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "public" },
                { from: "assets", to: "assets" },
            ]
        }),
    ],
};
