import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import type { Configuration } from "webpack"
import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"

process.env.NODE_ENV = "production"

const config: Configuration = {
	mode: "production",
	devtool: "source-map",
	output: {
		clean: true,
	},
	performance: {
		hints: "warning",
		maxEntrypointSize: 1 << 20,
		maxAssetSize: 1 << 20,
		assetFilter: (filename: string) => {
			const ext = path.extname(filename)
			return ext === "css" || ext === ".js"
		},
	},
	optimization: {
		minimizer: ["...", new CssMinimizerPlugin()],
	},
	plugins: [
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(__dirname, "../src/tsconfig.json"),
			},
		}),
		new ESLintPlugin({ context: path.resolve(__dirname, "../src"), extensions: ["js", "jsx", "ts", "tsx"] }),
	],
}

export default merge(createBaseConfig(), config)
