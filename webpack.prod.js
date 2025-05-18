const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

process.env["NODE_ENV"] = "production";

module.exports = merge(common, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
  },
  optimization: {
    minimize: true,
    minimizer: [
      `...`, // extend default minimizers like Terser
      new CssMinimizerPlugin(),
    ],
  },
});

