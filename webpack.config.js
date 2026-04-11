const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: {
      main: "./src/app.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
    },
    target: ["web", "es5"],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                url: {
                  filter: (url, resourcePath) => {
                    // assets 경로를 프로젝트 루트 기준으로 변환
                    if (url.startsWith("./assets/")) {
                      // 개발 모드: 절대 경로로 변환하여 devServer static과 매칭
                      // 프로덕션 모드: 그대로 유지하여 dist/assets와 매칭
                      return !isProduction;
                    }
                    return true;
                  },
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        chunks: ["main"],
        chunksSortMode: "manual",
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: "main.css",
            }),
          ]
        : []),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
          },
        ],
      }),
    ],
    optimization: {
      usedExports: true,
      sideEffects: true,
      minimizer: [
        ...(isProduction
          ? [
              new TerserPlugin({
                terserOptions: {
                  compress: { passes: 2, drop_console: false },
                  mangle: true,
                  format: { comments: false },
                },
                extractComments: false,
              }),
              new CssMinimizerPlugin(),
            ]
          : []),
      ],
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          pixi: {
            test: /[\\/]node_modules[\\/]pixi\.js/,
            name: "pixi",
            chunks: "all",
            priority: 20,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
        },
      },
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, "dist"),
        },
        {
          directory: path.join(__dirname, "assets"),
          publicPath: "/assets",
        },
      ],
      port: 8082,
      open: true,
      hot: true,
    },
    resolve: {
      extensions: [".js", ".json"],
    },
  };
};
