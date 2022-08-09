import { execSync } from "child_process"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import CopyPlugin from "copy-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import TerserPlugin from "terser-webpack-plugin"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import type { Compiler, Configuration } from "webpack"
import { DefinePlugin, ExternalsPlugin } from "webpack"

class ExternalsVendorPlugin {
	externals: Record<string, string>
	constructor(...deps: string[]) {
		this.externals = {}
		for (const dep of deps) {
			this.externals[dep] = dep
		}
	}
	apply(compiler: Compiler) {
		new ExternalsPlugin("commonjs", this.externals).apply(compiler)
	}
}

const clientWorkspaceFolder = path.resolve(__dirname, "src")

const configExtension: Configuration = {
	target: "node",
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	devtool: "source-map",
	entry: path.join(clientWorkspaceFolder, "extension.ts"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "[absolute-resource-path]",
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				minify: TerserPlugin.esbuildMinify,
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts$/,
				use: {
					loader: "swc-loader",
					options: {
						jsc: {
							parser: {
								syntax: "typescript",
							},
							target: "es2020",
						},
						module: {
							type: "commonjs",
						},
					},
				},
			},
			{
				test: /\.ya?ml$/,
				use: "js-yaml-loader",
			},
			{
				test: /.node$/,
				loader: "node-loader",
			},
		],
		// NOTE: https://github.com/microsoft/TypeScript/issues/39436
		noParse: [require.resolve("typescript/lib/typescript.js")],
	},
	resolve: {
		extensions: [".ts", ".js", ".json"],
	},
	plugins: [
		new TsPathsResolvePlugin({ tsConfigPath: path.resolve(clientWorkspaceFolder, "tsconfig.json") }),
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(clientWorkspaceFolder, "tsconfig.json"),
			},
		}),
		new ExternalsVendorPlugin("vscode"),
		new ESLintPlugin({ extensions: ["ts"] }),
		new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["extension*"] }),
		new CopyPlugin({
			patterns: [{ from: "node_modules/tailwindcss/lib/css", to: "css" }],
		}),
		new DefinePlugin({
			__COMMIT_HASH__: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
		}),
	],
}

export default configExtension
