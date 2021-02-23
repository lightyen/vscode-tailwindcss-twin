import { merge } from "webpack-merge"
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer"
import baseConfig from "./webpack.prod"

export default merge(baseConfig, {
	plugins: [
		new BundleAnalyzerPlugin({
			analyzerMode: "server",
			analyzerHost: "127.0.0.1",
			analyzerPort: 0,
			reportFilename: "report.html",
			defaultSizes: "parsed",
			openAnalyzer: true,
			generateStatsFile: false,
			statsFilename: "stats.json",
			statsOptions: null,
			logLevel: "info",
		}),
	],
})
