import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"
import type { Configuration } from "webpack"
import TerserPlugin from "terser-webpack-plugin"
import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"

import path from "path"

process.env.NODE_ENV = "production"

const config: Configuration = {
	mode: "production",
	devtool: "source-map",
	performance: {
		hints: "warning",
		maxEntrypointSize: 1 << 20,
		maxAssetSize: 1 << 20,
		assetFilter: filename => {
			const ext = path.extname(filename)
			return ext === "css" || ext === ".js"
		},
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
			}),
			new CssMinimizerPlugin(),
		],
	},
	module: {
		rules: [
			{
				test: /\.worker\.ts$/,
				exclude: /node_modules/,
				use: [
					"worker-loader",
					"babel-loader",
					{
						loader: "ts-loader",
						options: { context: path.join(process.cwd(), "src"), happyPackMode: true },
					},
				],
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules|\.test.tsx?|\.worker\.ts$/,
				use: [
					"babel-loader",
					{ loader: "ts-loader", options: { context: path.join(process.cwd(), "src"), happyPackMode: true } },
				],
			},
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: ["babel-loader"],
			},
		],
	},
	plugins: [
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(process.cwd(), "src", "tsconfig.json"),
			},
		}),
		new ESLintPlugin({ context: path.join(process.cwd(), "src"), extensions: ["js", "jsx", "ts", "tsx"] }),
	],
}

export default merge(createBaseConfig(), config)
