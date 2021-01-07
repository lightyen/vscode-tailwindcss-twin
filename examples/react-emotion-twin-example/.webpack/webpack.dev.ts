import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"
import type { Configuration } from "webpack"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin"

import path from "path"

process.env.NODE_ENV = "development"
process.env.PUBLIC_URL = ""

const config: Configuration = {
	mode: "development",
	devtool: "inline-source-map",
	stats: {
		children: false,
		modules: false,
		entrypoints: false,
	},
	performance: {
		hints: false,
		assetFilter: filename => {
			return filename.endsWith(".css") || filename.endsWith(".js")
		},
	},
	cache: {
		type: "memory",
	},
	module: {
		rules: [
			{
				test: /\.worker\.ts$/,
				exclude: /node_modules/,
				use: ["worker-loader", "babel-loader", { loader: "ts-loader", options: { happyPackMode: true } }],
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules|\.test.tsx?|\.worker\.ts$/,
				use: [
					{ loader: "thread-loader" },
					{ loader: "babel-loader" },
					{
						loader: "ts-loader",
						options: {
							happyPackMode: true,
						},
					},
				],
			},
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: ["thread-loader", "babel-loader"],
			},
		],
	},
	plugins: [
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(process.cwd(), "src", "tsconfig.json"),
			},
		}),
		new ReactRefreshPlugin(),
	],
	devServer: {
		hot: true,
		compress: true,
		open: true,
		host: "localhost",
		clientLogLevel: "none",
		contentBase: false,
		noInfo: true,
		historyApiFallback: true,
	},
}

export default merge(createBaseConfig(), config)
