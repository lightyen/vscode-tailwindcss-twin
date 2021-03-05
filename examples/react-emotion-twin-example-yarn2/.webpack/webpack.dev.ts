import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import type { Configuration } from "webpack"
import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"

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
		open: false, // yarn2
		host: "localhost",
		clientLogLevel: "none",
		contentBase: false,
		noInfo: true,
		historyApiFallback: true,
	},
}

export default merge(createBaseConfig(), config)
