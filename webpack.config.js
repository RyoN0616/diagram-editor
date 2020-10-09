const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
  mode: "development",
  entry: "./src/js/app.js",
  output: {
    path: `${__dirname}/dist`,
    filename: "app.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/html/index.html"
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.html$/,
        use: {
          loader: "html-loader"
        }
      }
    ],
  },
  devServer: {
    port: 1234,
    contentBase: __dirname + "/dist"
  },
};
